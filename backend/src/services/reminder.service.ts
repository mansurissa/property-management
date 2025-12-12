/**
 * Payment Reminder Service
 * Automated reminders before rent due date
 * Supports both Email and SMS notifications
 */

import { sendSMS, sendPaymentReminderSMS, sendLatePaymentNoticeSMS, sendLeaseExpiryReminderSMS } from './sms.service';
import { sendEmail } from './email.service';

const db = require('../database/models');
const { Tenant, Unit, Property, Payment, sequelize } = db;
const { Op } = require('sequelize');

export interface ReminderResult {
  success: boolean;
  sent: number;
  failed: number;
  details: Array<{
    tenantId: string;
    tenantName: string;
    type: 'email' | 'sms';
    success: boolean;
    error?: string;
  }>;
}

// Get tenants with rent due in X days
export const getTenantsWithUpcomingDue = async (
  daysBeforeDue: number = 3
): Promise<any[]> => {
  const today = new Date();
  const targetDay = today.getDate() + daysBeforeDue;

  // Find tenants whose rent is due on the target day
  // Assuming rent is due on the same day each month (common pattern)
  const tenants = await Tenant.findAll({
    where: {
      status: 'active',
      rentDueDay: targetDay > 28 ? { [Op.lte]: targetDay } : targetDay
    },
    include: [
      {
        model: Unit,
        as: 'unit',
        required: true,
        attributes: ['id', 'unitNumber', 'monthlyRent'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }]
      }
    ]
  });

  return tenants;
};

// Get tenants with overdue payments
export const getTenantsWithOverduePayments = async (): Promise<any[]> => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  // Get all active tenants
  const tenants = await Tenant.findAll({
    where: { status: { [Op.in]: ['active', 'late'] } },
    include: [
      {
        model: Unit,
        as: 'unit',
        required: true,
        attributes: ['id', 'unitNumber', 'monthlyRent'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }]
      }
    ]
  });

  const overdueList: any[] = [];

  for (const tenant of tenants) {
    // Check if current month's payment exists
    const payment = await Payment.findOne({
      where: {
        tenantId: tenant.id,
        periodMonth: currentMonth,
        periodYear: currentYear
      }
    });

    // If no payment and past due day, add to overdue list
    const rentDueDay = tenant.rentDueDay || 1;
    if (!payment && currentDay > rentDueDay) {
      overdueList.push({
        tenant,
        daysOverdue: currentDay - rentDueDay,
        amountDue: parseFloat(tenant.unit.monthlyRent)
      });
    }
  }

  return overdueList;
};

// Get tenants with leases expiring soon
export const getTenantsWithExpiringLeases = async (
  daysBeforeExpiry: number = 30
): Promise<any[]> => {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

  const tenants = await Tenant.findAll({
    where: {
      status: 'active',
      leaseEndDate: {
        [Op.between]: [today, targetDate]
      }
    },
    include: [
      {
        model: Unit,
        as: 'unit',
        required: true,
        attributes: ['id', 'unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        }]
      }
    ]
  });

  return tenants.map((tenant: any) => {
    const expiryDate = new Date(tenant.leaseEndDate);
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { tenant, daysRemaining, expiryDate };
  });
};

// Send payment reminders
export const sendPaymentReminders = async (
  daysBeforeDue: number = 3,
  channels: ('email' | 'sms')[] = ['sms', 'email']
): Promise<ReminderResult> => {
  const result: ReminderResult = {
    success: true,
    sent: 0,
    failed: 0,
    details: []
  };

  try {
    const tenants = await getTenantsWithUpcomingDue(daysBeforeDue);
    const today = new Date();

    for (const tenant of tenants) {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), tenant.rentDueDay || 1);
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const dueDateStr = dueDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // Send SMS
      if (channels.includes('sms') && tenant.phone) {
        try {
          const smsResult = await sendPaymentReminderSMS(
            tenant.phone,
            tenant.firstName,
            parseFloat(tenant.unit.monthlyRent),
            dueDateStr,
            tenant.unit.property.name
          );

          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'sms',
            success: smsResult.success,
            error: smsResult.success ? undefined : smsResult.message
          });

          if (smsResult.success) result.sent++;
          else result.failed++;
        } catch (error) {
          result.failed++;
          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'sms',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Send Email
      if (channels.includes('email') && tenant.email) {
        try {
          const emailResult = await sendEmail({
            to: tenant.email,
            subject: `Rent Payment Reminder - Due ${dueDateStr}`,
            html: generatePaymentReminderEmail(
              tenant.firstName,
              parseFloat(tenant.unit.monthlyRent),
              dueDateStr,
              tenant.unit.property.name,
              tenant.unit.unitNumber
            )
          });

          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'email',
            success: emailResult.success,
            error: emailResult.success ? undefined : emailResult.message
          });

          if (emailResult.success) result.sent++;
          else result.failed++;
        } catch (error) {
          result.failed++;
          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'email',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  } catch (error) {
    console.error('Send payment reminders error:', error);
    result.success = false;
  }

  return result;
};

// Send late payment notices
export const sendLatePaymentNotices = async (
  channels: ('email' | 'sms')[] = ['sms', 'email']
): Promise<ReminderResult> => {
  const result: ReminderResult = {
    success: true,
    sent: 0,
    failed: 0,
    details: []
  };

  try {
    const overdueList = await getTenantsWithOverduePayments();

    for (const { tenant, daysOverdue, amountDue } of overdueList) {
      // Send SMS
      if (channels.includes('sms') && tenant.phone) {
        try {
          const smsResult = await sendLatePaymentNoticeSMS(
            tenant.phone,
            tenant.firstName,
            amountDue,
            daysOverdue
          );

          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'sms',
            success: smsResult.success,
            error: smsResult.success ? undefined : smsResult.message
          });

          if (smsResult.success) result.sent++;
          else result.failed++;
        } catch (error) {
          result.failed++;
        }
      }

      // Send Email
      if (channels.includes('email') && tenant.email) {
        try {
          const emailResult = await sendEmail({
            to: tenant.email,
            subject: `Urgent: Rent Payment Overdue - ${daysOverdue} days`,
            html: generateLatePaymentEmail(
              tenant.firstName,
              amountDue,
              daysOverdue,
              tenant.unit.property.name,
              tenant.unit.unitNumber
            )
          });

          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'email',
            success: emailResult.success,
            error: emailResult.success ? undefined : emailResult.message
          });

          if (emailResult.success) result.sent++;
          else result.failed++;
        } catch (error) {
          result.failed++;
        }
      }

      // Update tenant status to 'late' if not already
      if (tenant.status !== 'late') {
        await tenant.update({ status: 'late' });
      }
    }
  } catch (error) {
    console.error('Send late payment notices error:', error);
    result.success = false;
  }

  return result;
};

// Send lease expiry reminders
export const sendLeaseExpiryReminders = async (
  daysBeforeExpiry: number = 30,
  channels: ('email' | 'sms')[] = ['sms', 'email']
): Promise<ReminderResult> => {
  const result: ReminderResult = {
    success: true,
    sent: 0,
    failed: 0,
    details: []
  };

  try {
    const expiringLeases = await getTenantsWithExpiringLeases(daysBeforeExpiry);

    for (const { tenant, daysRemaining, expiryDate } of expiringLeases) {
      const expiryDateStr = expiryDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // Send SMS
      if (channels.includes('sms') && tenant.phone) {
        try {
          const smsResult = await sendLeaseExpiryReminderSMS(
            tenant.phone,
            tenant.firstName,
            expiryDateStr,
            daysRemaining
          );

          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'sms',
            success: smsResult.success,
            error: smsResult.success ? undefined : smsResult.message
          });

          if (smsResult.success) result.sent++;
          else result.failed++;
        } catch (error) {
          result.failed++;
        }
      }

      // Send Email
      if (channels.includes('email') && tenant.email) {
        try {
          const emailResult = await sendEmail({
            to: tenant.email,
            subject: `Lease Expiry Reminder - ${daysRemaining} days remaining`,
            html: generateLeaseExpiryEmail(
              tenant.firstName,
              expiryDateStr,
              daysRemaining,
              tenant.unit.property.name,
              tenant.unit.unitNumber
            )
          });

          result.details.push({
            tenantId: tenant.id,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            type: 'email',
            success: emailResult.success,
            error: emailResult.success ? undefined : emailResult.message
          });

          if (emailResult.success) result.sent++;
          else result.failed++;
        } catch (error) {
          result.failed++;
        }
      }
    }
  } catch (error) {
    console.error('Send lease expiry reminders error:', error);
    result.success = false;
  }

  return result;
};

// Email templates

function generatePaymentReminderEmail(
  firstName: string,
  amount: number,
  dueDate: string,
  propertyName: string,
  unitNumber: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .amount-box { background-color: #EEF2FF; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #4F46E5; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>This is a friendly reminder that your rent payment is due soon.</p>
          <div class="amount-box">
            <p style="margin: 0; color: #666;">Amount Due</p>
            <p class="amount">${amount.toLocaleString()} RWF</p>
            <p style="margin: 0; color: #666;">Due: ${dueDate}</p>
          </div>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Unit:</strong> ${unitNumber}</p>
          <p>Please ensure your payment is made on time to avoid late fees.</p>
          <p>If you have already made this payment, please disregard this reminder.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateLatePaymentEmail(
  firstName: string,
  amount: number,
  daysOverdue: number,
  propertyName: string,
  unitNumber: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .amount-box { background-color: #FEF2F2; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #FECACA; }
        .amount { font-size: 32px; font-weight: bold; color: #DC2626; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Overdue Notice</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Your rent payment is now <strong>${daysOverdue} days overdue</strong>.</p>
          <div class="amount-box">
            <p style="margin: 0; color: #666;">Overdue Amount</p>
            <p class="amount">${amount.toLocaleString()} RWF</p>
            <p style="margin: 0; color: #DC2626;">${daysOverdue} days overdue</p>
          </div>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Unit:</strong> ${unitNumber}</p>
          <p>Please make your payment as soon as possible to avoid further action.</p>
          <p>If you're experiencing financial difficulties, please contact your landlord to discuss payment arrangements.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateLeaseExpiryEmail(
  firstName: string,
  expiryDate: string,
  daysRemaining: number,
  propertyName: string,
  unitNumber: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info-box { background-color: #FFFBEB; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #FDE68A; }
        .days { font-size: 48px; font-weight: bold; color: #F59E0B; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lease Expiry Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>This is a reminder that your lease agreement will be expiring soon.</p>
          <div class="info-box">
            <p class="days">${daysRemaining}</p>
            <p style="margin: 0; color: #666;">days remaining</p>
            <p style="margin-top: 10px; color: #B45309;">Expires: ${expiryDate}</p>
          </div>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Unit:</strong> ${unitNumber}</p>
          <p>Please contact your landlord to discuss lease renewal options if you wish to continue your tenancy.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default {
  sendPaymentReminders,
  sendLatePaymentNotices,
  sendLeaseExpiryReminders,
  getTenantsWithUpcomingDue,
  getTenantsWithOverduePayments,
  getTenantsWithExpiringLeases
};
