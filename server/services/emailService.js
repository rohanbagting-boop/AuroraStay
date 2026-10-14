import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';

let resendClient = null;

if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

const smtpEnabled =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

/**
 * Creates a fresh SMTP transporter on every call.
 * Uses explicit host + port 587 STARTTLS for Gmail (never `service:'gmail'`
 * which ignores custom timeout options).
 * Avoids stale connection-pool issues on Render / containerized deployments.
 */
function createSmtpTransporter() {
  if (!smtpEnabled) return null;

  const isBrevo =
    (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xsmtpsib-')) ||
    (process.env.SMTP_HOST && process.env.SMTP_HOST.toLowerCase().includes('brevo'));

  if (isBrevo) {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      connectionTimeout: 15000,
      greetingTimeout: 12000,
      socketTimeout: 15000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  const isGmail = process.env.SMTP_HOST.toLowerCase().includes('gmail');
  return nodemailer.createTransport(
    isGmail
      ? {
          // Explicit Gmail SMTP — port 587 STARTTLS works from cloud IPs
          // where port 465 SSL is often blocked at the network level.
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // STARTTLS (upgrades after connection)
          connectionTimeout: 12000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS.replace(/\s+/g, '')
          }
        }
      : {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          connectionTimeout: 12000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
  );
}

/**
 * Sends transactional email via Brevo REST API over HTTPS (port 443).
 * Essential for cloud hosts like Render where outbound SMTP ports (25, 465, 587)
 * are blocked at the network level by the hosting platform.
 */
async function sendViaBrevoApi({ to, name = 'Guest', subject, html, text }) {
  const brevoKey =
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SMTP_KEY ||
    (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xsmtpsib-') ? process.env.SMTP_PASS : null) ||
    (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('brevo') ? process.env.SMTP_PASS : null);

  if (!brevoKey) return null;

  const senderEmail = process.env.BREVO_SENDER || process.env.SMTP_USER || 'rohanbagting@gmail.com';
  const senderName = process.env.EMAIL_FROM || 'Aurora Stay Hotel';

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey.trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name }],
        subject,
        htmlContent: html,
        textContent: text
      })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`[Brevo API] Email successfully sent to ${to} (MessageId: ${data.messageId})`);
      return { sent: true };
    }

    console.warn('[Brevo API error]:', data);
    return { sent: false, error: data.message || `Brevo API HTTP ${response.status}` };
  } catch (err) {
    console.warn('[Brevo API network error]:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Wraps a send promise with a hard 20-second timeout so that blocked SMTP
 * connections on cloud hosts (Render/AWS) never hang the HTTP request.
 */
function withTimeout(promise, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) =>
      setTimeout(() => {
        console.warn('[Email] Send timed out after 20s — returning fallback.');
        resolve(fallback);
      }, 20000)
    )
  ]);
}

export async function sendOtpEmail(email, otp, name = 'Guest') {
  return withTimeout(_sendOtpEmail(email, otp, name), { sent: false, devCode: otp });
}

async function _sendOtpEmail(email, otp, name = 'Guest') {
  const transporter = createSmtpTransporter();
  let from = process.env.EMAIL_FROM || 'Aurora Stay Hotel';
  if (smtpEnabled) {
    if (!from.includes('@')) {
      from = `"${from}" <${process.env.SMTP_USER}>`;
    }
  } else if (!from.includes('@')) {
    from = `${from} <onboarding@resend.dev>`;
  }
  const subject = `${otp} is your Aurora Stay verification code`;
  const text = `Your Aurora Stay verification code is: ${otp}. This code expires in 10 minutes.`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fffdfa; border: 1px solid #ded7cc; border-radius: 8px; padding: 28px; color: #282523;">
      <div style="border-bottom: 2px solid #a77b38; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #171514; font-size: 22px;">Aurora Stay Hotel</h2>
        <span style="font-size: 12px; text-transform: uppercase; color: #7a5729; letter-spacing: 1px; font-weight: 600;">Account Verification</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #4a453f;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 1.5; color: #4a453f;">Thank you for creating an account with Aurora Stay. Please use the verification code below to complete your registration:</p>
      <div style="margin: 24px 0; text-align: center; background: #f7f3ec; border: 1px solid #e5ded3; border-radius: 8px; padding: 18px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #171514;">${otp}</span>
        <div style="margin-top: 8px; font-size: 12px; color: #746d64;">Expires in 10 minutes</div>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #746d64;">
        For your security, never share this code with anyone. You have 5 attempts to enter this code. If you did not create an account with Aurora Stay, please disregard this message.
      </p>
      <div style="margin-top: 24px; border-top: 1px solid #ded7cc; padding-top: 14px; font-size: 12px; color: #9a9186;">
        Aurora Stay Hotel &bull; Ayala Avenue, Makati City &bull; +63 2 8555 0188
      </div>
    </div>
  `;

  // 1. Try Brevo REST API first (over HTTPS port 443 — NEVER blocked by Render's SMTP firewall)
  const brevoResult = await sendViaBrevoApi({ to: email, name, subject, html, text });
  if (brevoResult && brevoResult.sent) return brevoResult;
  if (brevoResult && brevoResult.error) {
    console.warn('[Brevo API attempt failed, trying other providers]:', brevoResult.error);
  }

  // 2. Try Resend API
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: from.includes('@') ? from : 'Aurora Stay Hotel <onboarding@resend.dev>',
        to: email,
        subject,
        html,
        text
      });
      if (!response.error) {
        console.log(`[Resend] OTP email successfully sent to ${email} (ID: ${response.data?.id})`);
        return { sent: true };
      }
      console.warn('[Resend delivery notice, trying SMTP fallback]:', response.error);
    } catch (err) {
      console.warn('[Resend exception, trying SMTP fallback]:', err.message);
    }
  }

  // 3. Try SMTP via Nodemailer (port 587 STARTTLS)
  if (transporter) {
    try {
      await transporter.sendMail({ from, to: email, subject, html, text });
      console.log(`[SMTP] OTP email successfully sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send OTP email via SMTP:', err.message);
      return { sent: false, devCode: otp, error: brevoResult?.error || err.message };
    }
  }

  // 4. Fallback
  console.log(`[AURORA STAY OTP] Code for ${email}: ${otp}`);
  return { sent: false, devCode: otp, error: brevoResult?.error };
}

export async function sendPasswordResetEmail(email, resetToken, name = 'Guest') {
  const transporter = createSmtpTransporter();
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

  let from = process.env.EMAIL_FROM || 'Aurora Stay Hotel';
  if (smtpEnabled) {
    if (!from.includes('@')) {
      from = `"${from}" <${process.env.SMTP_USER}>`;
    }
  } else if (!from.includes('@')) {
    from = `${from} <onboarding@resend.dev>`;
  }

  const subject = 'Reset your Aurora Stay password';
  const text = `Hello ${name},\n\nYou requested a password reset for your Aurora Stay account.\n\nClick the link below to reset your password (expires in 30 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fffdfa; border: 1px solid #ded7cc; border-radius: 8px; padding: 28px; color: #282523;">
      <div style="border-bottom: 2px solid #a77b38; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #171514; font-size: 22px;">Aurora Stay Hotel</h2>
        <span style="font-size: 12px; text-transform: uppercase; color: #7a5729; letter-spacing: 1px; font-weight: 600;">Password Reset</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #4a453f;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 1.5; color: #4a453f;">You requested a password reset for your Aurora Stay account. Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" style="display: inline-block; background: #171514; color: #fff; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Reset my password &rarr;</a>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #746d64;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #a77b38; word-break: break-all;">${resetUrl}</p>
      <p style="font-size: 13px; line-height: 1.5; color: #746d64;">If you didn't request a password reset, you can safely ignore this email &mdash; your password will remain unchanged.</p>
      <div style="margin-top: 24px; border-top: 1px solid #ded7cc; padding-top: 14px; font-size: 12px; color: #9a9186;">
        Aurora Stay Hotel &bull; Ayala Avenue, Makati City &bull; +63 2 8555 0188
      </div>
    </div>
  `;

  // 1. Try Brevo REST API first
  const brevoResult = await sendViaBrevoApi({ to: email, name, subject, html, text });
  if (brevoResult && brevoResult.sent) return brevoResult;

  if (transporter) {
    try {
      await transporter.sendMail({ from, to: email, subject, html, text });
      console.log(`[SMTP] Password reset email sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send password reset email via SMTP:', err.message);
      return { sent: false, error: err.message };
    }
  }

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({ from, to: email, subject, html, text });
      if (response.error) {
        console.error('[Resend Error]', response.error);
        return { sent: false, error: response.error.message };
      }
      console.log(`[Resend] Password reset email sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send password reset email via Resend:', err.message);
      return { sent: false, error: err.message };
    }
  }

  // Dev fallback
  console.log(`\n========================================`);
  console.log(`[AURORA STAY RESET] Password reset for: ${email}`);
  console.log(`[AURORA STAY RESET] Link: ${resetUrl}`);
  console.log(`========================================\n`);
  return { sent: false, devLink: resetUrl };
}

export async function sendPasswordResetOtpEmail(email, otp, name = 'Guest') {
  return withTimeout(_sendPasswordResetOtpEmail(email, otp, name), { sent: false, devCode: otp });
}

async function _sendPasswordResetOtpEmail(email, otp, name = 'Guest') {
  const transporter = createSmtpTransporter();
  let from = process.env.EMAIL_FROM || 'Aurora Stay Hotel';
  if (smtpEnabled) {
    if (!from.includes('@')) {
      from = `"${from}" <${process.env.SMTP_USER}>`;
    }
  } else if (!from.includes('@')) {
    from = `${from} <onboarding@resend.dev>`;
  }

  const subject = `${otp} is your Aurora Stay password reset code`;
  const text = `Hello ${name},\n\nYour Aurora Stay password reset code is: ${otp}. This code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fffdfa; border: 1px solid #ded7cc; border-radius: 8px; padding: 28px; color: #282523;">
      <div style="border-bottom: 2px solid #a77b38; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #171514; font-size: 22px;">Aurora Stay Hotel</h2>
        <span style="font-size: 12px; text-transform: uppercase; color: #7a5729; letter-spacing: 1px; font-weight: 600;">Password Reset Code</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #4a453f;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 1.5; color: #4a453f;">You requested to reset your password. Use the 6-digit verification code below to proceed:</p>
      <div style="margin: 24px 0; text-align: center; background: #f7f3ec; border: 1px solid #e5ded3; border-radius: 8px; padding: 18px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #171514;">${otp}</span>
        <div style="margin-top: 8px; font-size: 12px; color: #746d64;">Expires in 15 minutes</div>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #746d64;">
        For your security, never share this code with anyone. If you didn't request a password reset, you can safely disregard this message.
      </p>
      <div style="margin-top: 24px; border-top: 1px solid #ded7cc; padding-top: 14px; font-size: 12px; color: #9a9186;">
        Aurora Stay Hotel &bull; Ayala Avenue, Makati City &bull; +63 2 8555 0188
      </div>
    </div>
  `;

  // 1. Try Brevo REST API first
  const brevoResult = await sendViaBrevoApi({ to: email, name, subject, html, text });
  if (brevoResult && brevoResult.sent) return brevoResult;
  if (brevoResult && brevoResult.error) {
    console.warn('[Brevo API reset attempt failed, trying other providers]:', brevoResult.error);
  }

  // 2. Try Resend API first for fast sub-second delivery
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: from.includes('@') ? from : 'Aurora Stay Hotel <onboarding@resend.dev>',
        to: email,
        subject,
        html,
        text
      });
      if (!response.error) {
        console.log(`[Resend] Password reset OTP sent to ${email} (ID: ${response.data?.id})`);
        return { sent: true };
      }
      console.warn('[Resend delivery notice, trying SMTP fallback]:', response.error);
    } catch (err) {
      console.warn('[Resend exception, trying SMTP fallback]:', err.message);
    }
  }

  // 3. Try SMTP via Nodemailer
  if (transporter) {
    try {
      await transporter.sendMail({ from, to: email, subject, html, text });
      console.log(`[SMTP] Password reset OTP sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send password reset OTP via SMTP:', err.message);
      return { sent: false, devCode: otp, error: brevoResult?.error || err.message };
    }
  }

  // Dev fallback
  console.log(`\n========================================`);
  console.log(`[AURORA STAY RESET OTP] Code for ${email}: ${otp}`);
  console.log(`========================================\n`);
  return { sent: false, devCode: otp };
}
