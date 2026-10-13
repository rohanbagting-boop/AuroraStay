import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';

let transporter = null;
let resendClient = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const isGmail = process.env.SMTP_HOST.toLowerCase().includes('gmail');
  transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS.replace(/\s+/g, '')
          }
        }
      : {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
  );
} else if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

export async function sendOtpEmail(email, otp, name = 'Guest') {
  let from = process.env.EMAIL_FROM || 'Aurora Stay Hotel';
  if (transporter) {
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

  // 1. Try SMTP via Nodemailer if configured
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        html,
        text
      });
      console.log(`[SMTP] OTP email successfully sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send OTP email via SMTP:', err.message);
      return { sent: false, devCode: otp, error: err.message };
    }
  }

  // 2. Try Resend API if configured
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from,
        to: email,
        subject,
        html,
        text
      });
      if (response.error) {
        console.error('[Resend Error]', response.error);
        return { sent: false, devCode: otp, error: response.error.message };
      } else {
        console.log(`[Resend] OTP email successfully sent to ${email} (ID: ${response.data?.id})`);
        return { sent: true };
      }
    } catch (err) {
      console.error('Failed to send OTP email via Resend API:', err.message);
      return { sent: false, devCode: otp, error: err.message };
    }
  }

  // 3. Fallback / Development console logging
  console.log(`\n========================================`);
  console.log(`[AURORA STAY OTP] Verification for: ${email}`);
  console.log(`[AURORA STAY OTP] Code: ${otp}`);
  console.log(`========================================\n`);

  return { sent: false, devCode: otp };
}

export async function sendPasswordResetEmail(email, resetToken, name = 'Guest') {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

  let from = process.env.EMAIL_FROM || 'Aurora Stay Hotel';
  if (transporter) {
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
  let from = process.env.EMAIL_FROM || 'Aurora Stay Hotel';
  if (transporter) {
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

  if (transporter) {
    try {
      await transporter.sendMail({ from, to: email, subject, html, text });
      console.log(`[SMTP] Password reset OTP sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send password reset OTP via SMTP:', err.message);
      return { sent: false, devCode: otp, error: err.message };
    }
  }

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({ from, to: email, subject, html, text });
      if (response.error) {
        console.error('[Resend Error]', response.error);
        return { sent: false, devCode: otp, error: response.error.message };
      }
      console.log(`[Resend] Password reset OTP sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error('Failed to send password reset OTP via Resend:', err.message);
      return { sent: false, devCode: otp, error: err.message };
    }
  }

  // Dev fallback
  console.log(`\n========================================`);
  console.log(`[AURORA STAY RESET OTP] Code for ${email}: ${otp}`);
  console.log(`========================================\n`);
  return { sent: false, devCode: otp };
}
