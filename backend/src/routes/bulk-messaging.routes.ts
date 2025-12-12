import { Router, Response } from 'express';
import { authenticate, AuthRequest, authorizeRoles } from '../middleware/auth.middleware';
import {
  getUserTenants,
  getPropertyTenants,
  getLateTenants,
  sendBulkMessage,
  sendBulkPaymentReminder,
  sendBulkLateNotice,
  sendBulkAnnouncement,
  MessageChannel,
  BulkRecipient
} from '../services/bulk-messaging.service';
import { SMSType } from '../services/sms.service';
import { NotificationType } from '../services/notification.service';
import {
  sendSuccess,
  sendError,
  sendServerError
} from '../utils/response.utils';
import { logAction } from '../services/audit.service';

const router = Router();

// All routes require authentication and owner/manager role
router.use(authenticate);
router.use(authorizeRoles('super_admin', 'agency', 'owner', 'manager'));

// GET /bulk-messaging/recipients - Get available recipients
router.get('/recipients', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, filter } = req.query;

    let recipients: BulkRecipient[];

    if (propertyId) {
      recipients = await getPropertyTenants(propertyId as string, req.user!.userId);
    } else if (filter === 'late') {
      recipients = await getLateTenants(req.user!.userId);
    } else {
      recipients = await getUserTenants(req.user!.userId);
    }

    return sendSuccess(res, {
      recipients,
      total: recipients.length,
      withPhone: recipients.filter(r => r.phone).length,
      withEmail: recipients.filter(r => r.email).length
    });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch recipients');
  }
});

// POST /bulk-messaging/send - Send custom bulk message
router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    const {
      message,
      subject,
      channels,
      propertyId,
      recipientFilter, // 'all', 'late', 'custom'
      customRecipientIds,
      smsType,
      inAppType,
      priority
    } = req.body;

    if (!message) {
      return sendError(res, 'Message is required');
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return sendError(res, 'At least one channel (sms, email, in_app) is required');
    }

    // Validate channels
    const validChannels: MessageChannel[] = ['sms', 'email', 'in_app'];
    const selectedChannels = channels.filter((c: string) => validChannels.includes(c as MessageChannel));

    if (selectedChannels.length === 0) {
      return sendError(res, 'Invalid channels. Use: sms, email, in_app');
    }

    // Get recipients based on filter
    let recipients: BulkRecipient[];

    if (customRecipientIds && Array.isArray(customRecipientIds)) {
      // Custom selection - get full details for selected IDs
      const allTenants = await getUserTenants(req.user!.userId);
      recipients = allTenants.filter(t => customRecipientIds.includes(t.id));
    } else if (propertyId) {
      recipients = await getPropertyTenants(propertyId, req.user!.userId);
    } else if (recipientFilter === 'late') {
      recipients = await getLateTenants(req.user!.userId);
    } else {
      recipients = await getUserTenants(req.user!.userId);
    }

    if (recipients.length === 0) {
      return sendError(res, 'No recipients found');
    }

    // Send bulk message
    const result = await sendBulkMessage(recipients, message, {
      channels: selectedChannels,
      smsType: (smsType as SMSType) || 'custom',
      emailSubject: subject || 'Message from your Property Manager',
      inAppType: (inAppType as NotificationType) || 'message',
      inAppPriority: priority || 'normal'
    });

    // Log the action
    await logAction({
      userId: req.user!.userId,
      action: 'notification.payment_reminder', // Using existing action type
      entityType: 'system',
      description: `Sent bulk message to ${recipients.length} recipients via ${selectedChannels.join(', ')}`,
      metadata: {
        recipientCount: recipients.length,
        channels: selectedChannels,
        smsSent: result.sms.sent,
        emailSent: result.email.sent,
        inAppSent: result.inApp.sent
      }
    });

    return sendSuccess(res, result, `Message sent to ${result.totalRecipients} recipients`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send bulk message');
  }
});

// POST /bulk-messaging/payment-reminder - Send payment reminders
router.post('/payment-reminder', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, channels, dueDate } = req.body;

    const result = await sendBulkPaymentReminder(req.user!.userId, {
      propertyId,
      channels,
      dueDate
    });

    await logAction({
      userId: req.user!.userId,
      action: 'notification.payment_reminder',
      entityType: 'system',
      description: `Sent bulk payment reminders to ${result.totalRecipients} tenants`,
      metadata: {
        propertyId,
        channels,
        ...result
      }
    });

    return sendSuccess(res, result, `Payment reminders sent to ${result.totalRecipients} tenants`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send payment reminders');
  }
});

// POST /bulk-messaging/late-notice - Send late payment notices
router.post('/late-notice', async (req: AuthRequest, res: Response) => {
  try {
    const { channels } = req.body;

    const result = await sendBulkLateNotice(req.user!.userId, { channels });

    await logAction({
      userId: req.user!.userId,
      action: 'notification.late_notice',
      entityType: 'system',
      description: `Sent late payment notices to ${result.totalRecipients} tenants`,
      metadata: result
    });

    return sendSuccess(res, result, `Late notices sent to ${result.totalRecipients} tenants`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send late notices');
  }
});

// POST /bulk-messaging/announcement - Send announcement
router.post('/announcement', async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, propertyId, channels, priority } = req.body;

    if (!title || !message) {
      return sendError(res, 'Title and message are required');
    }

    const result = await sendBulkAnnouncement(req.user!.userId, title, message, {
      propertyId,
      channels,
      priority
    });

    await logAction({
      userId: req.user!.userId,
      action: 'notification.payment_reminder', // Reusing existing action
      entityType: 'system',
      description: `Sent announcement "${title}" to ${result.totalRecipients} tenants`,
      metadata: {
        title,
        propertyId,
        ...result
      }
    });

    return sendSuccess(res, result, `Announcement sent to ${result.totalRecipients} tenants`);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to send announcement');
  }
});

export default router;
