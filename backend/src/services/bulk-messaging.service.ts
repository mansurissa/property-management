/**
 * Bulk Messaging Service
 * Send SMS and Email to multiple recipients in bulk
 */

import { sendSMS, SMSType, SMSResult } from './sms.service';
import { sendEmail } from './email.service';
import { createBulkNotifications, NotificationType } from './notification.service';

const { Tenant, User, Property, Unit } = require('../database/models');
const { Op } = require('sequelize');

export interface BulkRecipient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface BulkMessageResult {
  success: boolean;
  totalRecipients: number;
  sms: {
    sent: number;
    failed: number;
    errors: string[];
  };
  email: {
    sent: number;
    failed: number;
    errors: string[];
  };
  inApp: {
    sent: number;
    failed: number;
  };
}

export type MessageChannel = 'sms' | 'email' | 'in_app';

export interface BulkMessageOptions {
  channels: MessageChannel[];
  smsType?: SMSType;
  smsData?: Record<string, any>;
  emailSubject?: string;
  emailHtml?: string;
  inAppType?: NotificationType;
  inAppPriority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Get tenants for a user (owner/manager)
export const getUserTenants = async (userId: string): Promise<BulkRecipient[]> => {
  try {
    const tenants = await Tenant.findAll({
      where: {
        userId,
        status: { [Op.in]: ['active', 'late'] }
      },
      attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
    });

    return tenants.map((t: any) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      phone: t.phone,
      email: t.email
    }));
  } catch (error) {
    console.error('Get user tenants error:', error);
    return [];
  }
};

// Get tenants for a specific property
export const getPropertyTenants = async (
  propertyId: string,
  userId: string
): Promise<BulkRecipient[]> => {
  try {
    const property = await Property.findOne({
      where: { id: propertyId, userId },
      include: [{
        model: Unit,
        as: 'units',
        include: [{
          model: Tenant,
          as: 'tenant',
          where: { status: { [Op.in]: ['active', 'late'] } },
          required: false
        }]
      }]
    });

    if (!property) return [];

    const tenants: BulkRecipient[] = [];
    for (const unit of property.units || []) {
      if (unit.tenant) {
        tenants.push({
          id: unit.tenant.id,
          name: `${unit.tenant.firstName} ${unit.tenant.lastName}`,
          phone: unit.tenant.phone,
          email: unit.tenant.email
        });
      }
    }

    return tenants;
  } catch (error) {
    console.error('Get property tenants error:', error);
    return [];
  }
};

// Get tenants with overdue payments
export const getLateTenants = async (userId: string): Promise<BulkRecipient[]> => {
  try {
    const tenants = await Tenant.findAll({
      where: {
        userId,
        status: 'late'
      },
      attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
    });

    return tenants.map((t: any) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      phone: t.phone,
      email: t.email
    }));
  } catch (error) {
    console.error('Get late tenants error:', error);
    return [];
  }
};

// Send bulk SMS
export const sendBulkSMS = async (
  recipients: BulkRecipient[],
  type: SMSType,
  data: Record<string, any> = {},
  customMessage?: string
): Promise<{ sent: number; failed: number; errors: string[] }> => {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    if (!recipient.phone) {
      failed++;
      errors.push(`${recipient.name}: No phone number`);
      continue;
    }

    const messageData = {
      ...data,
      tenantName: recipient.name
    };

    const result = await sendSMS(recipient.phone, type, messageData, customMessage);

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient.name}: ${result.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, errors };
};

// Send bulk Email
export const sendBulkEmail = async (
  recipients: BulkRecipient[],
  subject: string,
  htmlTemplate: string, // Use {{name}} placeholder
  textTemplate?: string
): Promise<{ sent: number; failed: number; errors: string[] }> => {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    if (!recipient.email) {
      failed++;
      errors.push(`${recipient.name}: No email address`);
      continue;
    }

    // Replace placeholders
    const html = htmlTemplate.replace(/\{\{name\}\}/g, recipient.name);
    const text = textTemplate?.replace(/\{\{name\}\}/g, recipient.name);

    const result = await sendEmail({
      to: recipient.email,
      subject,
      html,
      text
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient.name}: ${result.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { sent, failed, errors };
};

// Send message via multiple channels
export const sendBulkMessage = async (
  recipients: BulkRecipient[],
  message: string,
  options: BulkMessageOptions
): Promise<BulkMessageResult> => {
  const result: BulkMessageResult = {
    success: true,
    totalRecipients: recipients.length,
    sms: { sent: 0, failed: 0, errors: [] },
    email: { sent: 0, failed: 0, errors: [] },
    inApp: { sent: 0, failed: 0 }
  };

  if (recipients.length === 0) {
    result.success = false;
    return result;
  }

  // Send SMS if requested
  if (options.channels.includes('sms')) {
    const smsResult = await sendBulkSMS(
      recipients,
      options.smsType || 'custom',
      options.smsData || {},
      message
    );
    result.sms = smsResult;
  }

  // Send Email if requested
  if (options.channels.includes('email') && options.emailSubject) {
    const emailHtml = options.emailHtml || generateBulkEmailHtml(message, options.emailSubject);
    const emailResult = await sendBulkEmail(
      recipients,
      options.emailSubject,
      emailHtml,
      message
    );
    result.email = emailResult;
  }

  // Send In-App notifications if requested
  if (options.channels.includes('in_app')) {
    // Get user IDs for tenants (those with linked accounts)
    const tenantIds = recipients.map(r => r.id);
    const tenantsWithAccounts = await Tenant.findAll({
      where: {
        id: { [Op.in]: tenantIds },
        userAccountId: { [Op.ne]: null }
      },
      attributes: ['userAccountId']
    });

    const userIds = tenantsWithAccounts.map((t: any) => t.userAccountId).filter(Boolean);

    if (userIds.length > 0) {
      const inAppResult = await createBulkNotifications(userIds, {
        type: options.inAppType || 'announcement',
        title: options.emailSubject || 'Message from Property Manager',
        message,
        priority: options.inAppPriority || 'normal'
      });

      result.inApp = {
        sent: inAppResult.count,
        failed: userIds.length - inAppResult.count
      };
    }
  }

  // Determine overall success
  const totalSent = result.sms.sent + result.email.sent + result.inApp.sent;
  result.success = totalSent > 0;

  return result;
};

// Generate standard email HTML for bulk messages
const generateBulkEmailHtml = (message: string, title: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .message { background-color: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Renta</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Hi {{name}},</p>
          <div class="message">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
          <p>Property Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Convenience functions for common bulk messages

export const sendBulkPaymentReminder = async (
  userId: string,
  options: {
    propertyId?: string;
    channels?: MessageChannel[];
    dueDate?: string;
  } = {}
): Promise<BulkMessageResult> => {
  const recipients = options.propertyId
    ? await getPropertyTenants(options.propertyId, userId)
    : await getUserTenants(userId);

  const dueDate = options.dueDate || new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return sendBulkMessage(
    recipients,
    `This is a reminder that your rent payment is due on ${dueDate}. Please ensure timely payment to avoid late fees.`,
    {
      channels: options.channels || ['sms', 'email', 'in_app'],
      smsType: 'payment_reminder',
      smsData: { dueDate },
      emailSubject: 'Rent Payment Reminder',
      inAppType: 'payment_reminder',
      inAppPriority: 'normal'
    }
  );
};

export const sendBulkLateNotice = async (
  userId: string,
  options: {
    channels?: MessageChannel[];
  } = {}
): Promise<BulkMessageResult> => {
  const recipients = await getLateTenants(userId);

  return sendBulkMessage(
    recipients,
    'Your rent payment is overdue. Please make payment as soon as possible to avoid further action. Contact your property manager if you need to discuss payment arrangements.',
    {
      channels: options.channels || ['sms', 'email', 'in_app'],
      smsType: 'late_payment',
      smsData: { daysOverdue: 0 },
      emailSubject: 'Overdue Rent Payment Notice',
      inAppType: 'payment_overdue',
      inAppPriority: 'high'
    }
  );
};

export const sendBulkAnnouncement = async (
  userId: string,
  title: string,
  message: string,
  options: {
    propertyId?: string;
    channels?: MessageChannel[];
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  } = {}
): Promise<BulkMessageResult> => {
  const recipients = options.propertyId
    ? await getPropertyTenants(options.propertyId, userId)
    : await getUserTenants(userId);

  return sendBulkMessage(recipients, message, {
    channels: options.channels || ['email', 'in_app'],
    emailSubject: title,
    inAppType: 'announcement',
    inAppPriority: options.priority || 'normal'
  });
};

export default {
  getUserTenants,
  getPropertyTenants,
  getLateTenants,
  sendBulkSMS,
  sendBulkEmail,
  sendBulkMessage,
  sendBulkPaymentReminder,
  sendBulkLateNotice,
  sendBulkAnnouncement
};
