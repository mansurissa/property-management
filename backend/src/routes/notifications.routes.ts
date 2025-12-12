import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  sendPaymentReminderSMS,
  sendPaymentConfirmationSMS,
  sendMaintenanceUpdateSMS,
  sendCustomSMS
} from '../services/sms.service';
import {
  sendPaymentReminders,
  sendLatePaymentNotices,
  sendLeaseExpiryReminders
} from '../services/reminder.service';
import {
  sendSuccess,
  sendError,
  sendServerError
} from '../utils/response.utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /notifications/sms/send - Send custom SMS
router.post('/sms/send', async (req: AuthRequest, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return sendError(res, 'Phone number and message are required');
    }

    const result = await sendCustomSMS(to, message);

    if (!result.success) {
      return sendError(res, result.message);
    }

    return sendSuccess(res, result, 'SMS sent successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send SMS');
  }
});

// POST /notifications/reminders/payment - Send payment reminders
router.post('/reminders/payment', async (req: AuthRequest, res: Response) => {
  try {
    const { daysBeforeDue = 3, channels = ['sms', 'email'] } = req.body;

    const result = await sendPaymentReminders(daysBeforeDue, channels);

    return sendSuccess(res, result, `Payment reminders processed: ${result.sent} sent, ${result.failed} failed`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send payment reminders');
  }
});

// POST /notifications/reminders/late - Send late payment notices
router.post('/reminders/late', async (req: AuthRequest, res: Response) => {
  try {
    const { channels = ['sms', 'email'] } = req.body;

    const result = await sendLatePaymentNotices(channels);

    return sendSuccess(res, result, `Late payment notices processed: ${result.sent} sent, ${result.failed} failed`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send late payment notices');
  }
});

// POST /notifications/reminders/lease-expiry - Send lease expiry reminders
router.post('/reminders/lease-expiry', async (req: AuthRequest, res: Response) => {
  try {
    const { daysBeforeExpiry = 30, channels = ['sms', 'email'] } = req.body;

    const result = await sendLeaseExpiryReminders(daysBeforeExpiry, channels);

    return sendSuccess(res, result, `Lease expiry reminders processed: ${result.sent} sent, ${result.failed} failed`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send lease expiry reminders');
  }
});

// POST /notifications/tenant/:tenantId/payment-reminder - Send payment reminder to specific tenant
router.post('/tenant/:tenantId/payment-reminder', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { Tenant, Unit, Property } = require('../database/models');

    const tenant = await Tenant.findOne({
      where: {
        id: tenantId,
        userId: req.user?.userId
      },
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property'
        }]
      }]
    });

    if (!tenant) {
      return sendError(res, 'Tenant not found', 404);
    }

    if (!tenant.phone) {
      return sendError(res, 'Tenant has no phone number');
    }

    const dueDate = new Date();
    dueDate.setDate(tenant.rentDueDay || 1);
    if (dueDate < new Date()) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const result = await sendPaymentReminderSMS(
      tenant.phone,
      tenant.firstName,
      parseFloat(tenant.unit.monthlyRent),
      dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      tenant.unit.property.name
    );

    if (!result.success) {
      return sendError(res, result.message);
    }

    return sendSuccess(res, result, 'Payment reminder sent successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send payment reminder');
  }
});

// POST /notifications/payment/:paymentId/confirmation - Send payment confirmation
router.post('/payment/:paymentId/confirmation', async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { Payment, Tenant } = require('../database/models');

    const payment = await Payment.findByPk(paymentId, {
      include: [{
        model: Tenant,
        as: 'tenant',
        where: { userId: req.user?.userId }
      }]
    });

    if (!payment) {
      return sendError(res, 'Payment not found', 404);
    }

    if (!payment.tenant.phone) {
      return sendError(res, 'Tenant has no phone number');
    }

    const receiptNumber = `RNT-${new Date(payment.paymentDate).getFullYear()}${String(new Date(payment.paymentDate).getMonth() + 1).padStart(2, '0')}-${payment.id.slice(-8).toUpperCase()}`;

    const result = await sendPaymentConfirmationSMS(
      payment.tenant.phone,
      payment.tenant.firstName,
      parseFloat(payment.amount),
      receiptNumber
    );

    if (!result.success) {
      return sendError(res, result.message);
    }

    return sendSuccess(res, result, 'Payment confirmation sent successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send payment confirmation');
  }
});

// POST /notifications/maintenance/:ticketId/update - Send maintenance update
router.post('/maintenance/:ticketId/update', async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { MaintenanceTicket, Unit, Property, Tenant } = require('../database/models');

    const ticket = await MaintenanceTicket.findByPk(ticketId, {
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [{
            model: Property,
            as: 'property',
            where: { userId: req.user?.userId }
          }]
        },
        {
          model: Tenant,
          as: 'tenant'
        }
      ]
    });

    if (!ticket) {
      return sendError(res, 'Maintenance ticket not found', 404);
    }

    if (!ticket.tenant?.phone) {
      return sendError(res, 'Tenant has no phone number');
    }

    const result = await sendMaintenanceUpdateSMS(
      ticket.tenant.phone,
      ticket.tenant.firstName,
      ticket.id,
      ticket.status
    );

    if (!result.success) {
      return sendError(res, result.message);
    }

    return sendSuccess(res, result, 'Maintenance update sent successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send maintenance update');
  }
});

export default router;
