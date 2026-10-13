import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';

let transporter = null;
let resendClient = null;

if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendOtpEmail(email, otp, name = 'Guest') {
  const defaultFrom = process.env.RESEND_API_KEY
    ? (process.env.EMAIL_FROM || 'Aurora Stay Hotel <onboarding@resend.dev>')
    : (process.env.EMAIL_FROM || 'Aurora Stay Hotel <no-reply@aurorastayhotel.com>');

  const from = defaultFrom;
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

  // 1. Try Resend API if configured
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

  // 2. Try SMTP via Nodemailer if configured
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
    }
  }

  // 3. Fallback / Development console logging
  console.log(`\n========================================`);
  console.log(`[AURORA STAY OTP] Verification for: ${email}`);
  console.log(`[AURORA STAY OTP] Code: ${otp}`);
  console.log(`========================================\n`);

  return { sent: false, devCode: otp };
}
