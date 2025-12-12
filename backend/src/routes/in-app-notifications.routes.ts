import { Router, Response } from 'express';
import { authenticate, AuthRequest, authorizeRoles } from '../middleware/auth.middleware';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
  createBulkNotifications,
  cleanupOldNotifications,
  NotificationType,
  NotificationPriority
} from '../services/notification.service';
import {
  sendSuccess,
  sendError,
  sendServerError,
  sendDeleted,
  sendCreated,
  parsePagination,
  sendPaginated
} from '../utils/response.utils';

const { User } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /in-app-notifications - Get user's notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { unreadOnly, type } = req.query;
    const pagination = parsePagination(req.query);

    const result = await getUserNotifications(req.user!.userId, {
      limit: pagination.limit,
      offset: pagination.offset,
      unreadOnly: unreadOnly === 'true',
      type: type as NotificationType | undefined
    });

    if (!result.success) {
      return sendError(res, 'Failed to fetch notifications');
    }

    return res.status(200).json({
      success: true,
      data: result.notifications,
      meta: {
        total: result.total,
        unreadCount: result.unreadCount,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(result.total / pagination.limit)
      }
    });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch notifications');
  }
});

// GET /in-app-notifications/unread-count - Get unread notification count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await getUnreadCount(req.user!.userId);
    return sendSuccess(res, { count });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to get unread count');
  }
});

// POST /in-app-notifications/:id/read - Mark notification as read
router.post('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const result = await markAsRead(req.params.id, req.user!.userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to mark as read', 404);
    }

    return sendSuccess(res, result.notification, 'Notification marked as read');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to mark as read');
  }
});

// POST /in-app-notifications/read-all - Mark all notifications as read
router.post('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const result = await markAllAsRead(req.user!.userId);

    return sendSuccess(
      res,
      { markedCount: result.count },
      `${result.count} notifications marked as read`
    );
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to mark all as read');
  }
});

// DELETE /in-app-notifications/:id - Delete a notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteNotification(req.params.id, req.user!.userId);

    if (!result.success) {
      return sendError(res, result.error || 'Notification not found', 404);
    }

    return sendDeleted(res, 'Notification deleted');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to delete notification');
  }
});

// ============= Admin/Owner Routes =============

// POST /in-app-notifications/send - Send notification to specific user(s)
router.post(
  '/send',
  authorizeRoles('super_admin', 'agency', 'owner', 'manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userIds, userId, type, title, message, priority, actionUrl, metadata } = req.body;

      if (!title || !message || !type) {
        return sendError(res, 'Title, message, and type are required');
      }

      // Single user notification
      if (userId && !userIds) {
        const result = await createNotification({
          userId,
          type: type as NotificationType,
          title,
          message,
          priority: priority as NotificationPriority,
          actionUrl,
          metadata
        });

        if (!result.success) {
          return sendError(res, result.error || 'Failed to send notification');
        }

        return sendCreated(res, result.notification, 'Notification sent');
      }

      // Bulk notifications
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        const result = await createBulkNotifications(userIds, {
          type: type as NotificationType,
          title,
          message,
          priority: priority as NotificationPriority,
          actionUrl,
          metadata
        });

        if (!result.success) {
          return sendError(res, `Failed to send notifications: ${result.errors.join(', ')}`);
        }

        return sendCreated(
          res,
          { sentCount: result.count },
          `${result.count} notifications sent`
        );
      }

      return sendError(res, 'Either userId or userIds array is required');
    } catch (error) {
      return sendServerError(res, error as Error, 'Failed to send notification');
    }
  }
);

// POST /in-app-notifications/broadcast - Broadcast to all users or by role
router.post(
  '/broadcast',
  authorizeRoles('super_admin', 'agency'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, message, type, priority, roles } = req.body;

      if (!title || !message) {
        return sendError(res, 'Title and message are required');
      }

      // Get target users
      const whereClause: any = { isActive: true };
      if (roles && Array.isArray(roles) && roles.length > 0) {
        whereClause.role = roles;
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: ['id']
      });

      if (users.length === 0) {
        return sendError(res, 'No users found matching criteria');
      }

      const userIds = users.map((u: any) => u.id);

      const result = await createBulkNotifications(userIds, {
        type: (type as NotificationType) || 'announcement',
        title,
        message,
        priority: (priority as NotificationPriority) || 'normal'
      });

      return sendCreated(
        res,
        { sentCount: result.count, targetedUsers: userIds.length },
        `Broadcast sent to ${result.count} users`
      );
    } catch (error) {
      return sendServerError(res, error as Error, 'Failed to broadcast notification');
    }
  }
);

// POST /in-app-notifications/cleanup - Clean up old read notifications (admin only)
router.post(
  '/cleanup',
  authorizeRoles('super_admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { daysOld = 30 } = req.body;

      const result = await cleanupOldNotifications(daysOld);

      return sendSuccess(
        res,
        { deletedCount: result.count },
        `Cleaned up ${result.count} old notifications`
      );
    } catch (error) {
      return sendServerError(res, error as Error, 'Failed to cleanup notifications');
    }
  }
);

export default router;
