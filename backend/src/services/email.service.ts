import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

// Create transporter based on environment
const createTransporter = () => {
  // Production: Use real SMTP settings
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Development: Use Ethereal (fake SMTP) or console logging
  if (process.env.SMTP_HOST) {
    // If SMTP is configured in dev, use it
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Fallback: Return null, we'll log to console
  return null;
};

const transporter = createTransporter();

export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    const { to, subject, html, text } = options;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Renta" <noreply@renta.rw>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    // If no transporter (dev without SMTP), log to console
    if (!transporter) {
      console.log('\n========== EMAIL (Development Mode) ==========');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html.replace(/<[^>]*>/g, '')}`);
      console.log('==============================================\n');

      return {
        success: true,
        message: 'Email logged to console (development mode)',
        messageId: `dev-${Date.now()}`
      };
    }

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
};

// Password Reset Email
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string | null,
  resetToken: string
): Promise<EmailResult> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Renta</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hi ${firstName || 'there'},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
          <p>Property Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Renta - Password Reset Request',
    html
  });
};

// Manager Invitation Email
export const sendManagerInvitationEmail = async (
  email: string,
  inviterName: string,
  propertyName: string,
  resetToken: string
): Promise<EmailResult> => {
  const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=invitation`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .highlight { background-color: #EEF2FF; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Renta</h1>
        </div>
        <div class="content">
          <h2>You've Been Invited as a Property Manager!</h2>
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to manage their property on Renta:</p>
          <div class="highlight">
            <strong>Property:</strong> ${propertyName}
          </div>
          <p>To accept this invitation and set up your account, click the button below:</p>
          <p style="text-align: center;">
            <a href="${setupUrl}" class="button">Accept Invitation & Set Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${setupUrl}</p>
          <p><strong>This invitation will expire in 7 days.</strong></p>
          <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
          <p>Property Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Renta - You've been invited to manage ${propertyName}`,
    html
  });
};

// Welcome Email for New Users
export const sendWelcomeEmail = async (
  email: string,
  firstName: string | null,
  role: string
): Promise<EmailResult> => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

  const roleDescriptions: Record<string, string> = {
    owner: 'manage your properties, track tenants, and monitor payments',
    tenant: 'view your lease details, make payments, and submit maintenance requests',
    manager: 'manage assigned properties, handle tenant communications, and track maintenance',
    agent: 'assist property owners and tenants with their real estate needs',
    maintenance: 'view and manage maintenance requests assigned to you'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Renta!</h1>
        </div>
        <div class="content">
          <h2>Your Account is Ready</h2>
          <p>Hi ${firstName || 'there'},</p>
          <p>Welcome to Renta! Your account has been successfully created.</p>
          <p>As a <strong>${role}</strong>, you can now ${roleDescriptions[role] || 'access all available features'}.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Your Account</a>
          </p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
          <p>Property Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Renta!',
    html
  });
};
