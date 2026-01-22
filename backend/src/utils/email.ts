import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { env } from '../config/environment';
import { logger } from './logger';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

let transporter: Transporter;

const createTransporter = (): Transporter => {
    return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    });
};

const getTransporter = (): Transporter => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        const mailOptions: SendMailOptions = {
            from: `"Roomify" <${env.EMAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        await getTransporter().sendMail(mailOptions);
        logger.info(`Email sent to ${options.to}: ${options.subject}`);
        return true;
    } catch (error) {
        logger.error('Failed to send email:', error);
        return false;
    }
};

export const sendVerificationEmail = async (
    email: string,
    name: string,
    verificationToken: string
): Promise<boolean> => {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1F2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
        .content { background: #F9FAFB; padding: 30px; border-radius: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
        .footer { text-align: center; padding: 20px 0; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Roomify</div>
        </div>
        <div class="content">
          <h2>Verify Your Email</h2>
          <p>Hi ${name},</p>
          <p>Welcome to Roomify! Please verify your email address to complete your registration.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563EB;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Roomify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: 'Verify Your Roomify Account',
        html,
        text: `Hi ${name}, Please verify your email by visiting: ${verificationUrl}`,
    });
};

export const sendPasswordResetEmail = async (
    email: string,
    name: string,
    resetToken: string
): Promise<boolean> => {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1F2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
        .content { background: #F9FAFB; padding: 30px; border-radius: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
        .footer { text-align: center; padding: 20px 0; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Roomify</div>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Roomify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: 'Reset Your Roomify Password',
        html,
        text: `Hi ${name}, Reset your password by visiting: ${resetUrl}`,
    });
};

export const sendVerificationStatusEmail = async (
    email: string,
    name: string,
    documentType: string,
    status: 'approved' | 'rejected',
    reason?: string
): Promise<boolean> => {
    const isApproved = status === 'approved';
    const statusColor = isApproved ? '#10B981' : '#EF4444';
    const statusText = isApproved ? 'Approved' : 'Rejected';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1F2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
        .content { background: #F9FAFB; padding: 30px; border-radius: 12px; }
        .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; color: white; background: ${statusColor}; }
        .footer { text-align: center; padding: 20px 0; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Roomify</div>
        </div>
        <div class="content">
          <h2>Document Verification Update</h2>
          <p>Hi ${name},</p>
          <p>Your <strong>${documentType.replace(/_/g, ' ')}</strong> has been reviewed.</p>
          <p style="text-align: center; margin: 20px 0;">
            <span class="status">${statusText}</span>
          </p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          ${!isApproved ? '<p>Please upload a new document and try again.</p>' : '<p>Your account verification is now complete!</p>'}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Roomify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: `Document ${statusText} - Roomify`,
        html,
        text: `Hi ${name}, Your ${documentType} has been ${status}. ${reason || ''}`,
    });
};

export const sendBookingNotificationEmail = async (
    email: string,
    name: string,
    propertyTitle: string,
    status: 'requested' | 'approved' | 'rejected',
    message?: string
): Promise<boolean> => {
    const statusMessages: Record<string, { subject: string; text: string }> = {
        requested: {
            subject: 'New Booking Request',
            text: `You have received a new booking request for "${propertyTitle}".`,
        },
        approved: {
            subject: 'Booking Approved!',
            text: `Great news! Your booking request for "${propertyTitle}" has been approved.`,
        },
        rejected: {
            subject: 'Booking Update',
            text: `Your booking request for "${propertyTitle}" was not approved.`,
        },
    };

    const { subject, text } = statusMessages[status];

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1F2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
        .content { background: #F9FAFB; padding: 30px; border-radius: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
        .footer { text-align: center; padding: 20px 0; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Roomify</div>
        </div>
        <div class="content">
          <h2>${subject}</h2>
          <p>Hi ${name},</p>
          <p>${text}</p>
          ${message ? `<p><em>"${message}"</em></p>` : ''}
          <p style="text-align: center; margin: 30px 0;">
            <a href="${env.FRONTEND_URL}/bookings" class="button">View Bookings</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Roomify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: `${subject} - Roomify`,
        html,
        text: `Hi ${name}, ${text} ${message || ''}`,
    });
};

export default {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendVerificationStatusEmail,
    sendBookingNotificationEmail,
};
