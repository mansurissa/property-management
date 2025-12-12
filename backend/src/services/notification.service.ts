/**
 * In-App Notification Service
 * Handles creating, retrieving, and managing in-app notifications
 */

const { Notification, User } = require('../database/models');
const { Op } = require('sequelize');

export type NotificationType =
  | 'payment_reminder'
  | 'payment_received'
  | 'payment_overdue'
  | 'lease_expiry'
  | 'maintenance_update'
  | 'maintenance_new'
  | 'tenant_added'
  | 'tenant_removed'
  | 'property_update'
  | 'system'
  | 'announcement'
  | 'message';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationEntityType =
  | 'payment'
  | 'tenant'
  | 'property'
  | 'unit'
  | 'maintenance'
  | 'lease'
  | 'system';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityType?: NotificationEntityType;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface NotificationResult {
  success: boolean;
  notification?: any;
  error?: string;
}

export interface NotificationListResult {
  success: boolean;
  notifications: any[];
  total: number;
  unreadCount: number;
}

// Create a single notification
export const createNotification = async (
  params: CreateNotificationParams
): Promise<NotificationResult> => {
  try {
    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      priority: params.priority || 'normal',
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      actionUrl: params.actionUrl || null,
      metadata: params.metadata || {},
      expiresAt: params.expiresAt || null
    });

    return {
      success: true,
      notification
    };
  } catch (error) {
    console.error('Create notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification'
    };
  }
};

// Create notifications for multiple users (bulk)
export const createBulkNotifications = async (
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<{ success: boolean; count: number; errors: string[] }> => {
  const errors: string[] = [];
  let successCount = 0;

  const notifications = userIds.map(userId => ({
    userId,
    type: params.type,
    title: params.title,
    message: params.message,
    priority: params.priority || 'normal',
    entityType: params.entityType || null,
    entityId: params.entityId || null,
    actionUrl: params.actionUrl || null,
    metadata: params.metadata || {},
    expiresAt: params.expiresAt || null
  }));

  try {
    const created = await Notification.bulkCreate(notifications);
    successCount = created.length;
  } catch (error) {
    console.error('Bulk create notifications error:', error);
    errors.push(error instanceof Error ? error.message : 'Bulk creation failed');
  }

  return {
    success: errors.length === 0,
    count: successCount,
    errors
  };
};

// Get notifications for a user
export const getUserNotifications = async (
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
): Promise<NotificationListResult> => {
  try {
    const whereClause: any = { userId };

    if (options.unreadOnly) {
      whereClause.isRead = false;
    }

    if (options.type) {
      whereClause.type = options.type;
    }

    // Exclude expired notifications
    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [
        ['isRead', 'ASC'], // Unread first
        ['priority', 'DESC'], // Higher priority first
        ['createdAt', 'DESC'] // Newest first
      ],
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    // Get unread count
    const unreadCount = await Notification.count({
      where: {
        userId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });

    return {
      success: true,
      notifications,
      total: count,
      unreadCount
    };
  } catch (error) {
    console.error('Get user notifications error:', error);
    return {
      success: false,
      notifications: [],
      total: 0,
      unreadCount: 0
    };
  }
};

// Mark notification as read
export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<NotificationResult> => {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found'
      };
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    return {
      success: true,
      notification
    };
  } catch (error) {
    console.error('Mark as read error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as read'
    };
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (
  userId: string
): Promise<{ success: boolean; count: number }> => {
  try {
    const [count] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );

    return {
      success: true,
      count
    };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return {
      success: false,
      count: 0
    };
  }
};

// Delete a notification
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deleted = await Notification.destroy({
      where: { id: notificationId, userId }
    });

    if (deleted === 0) {
      return {
        success: false,
        error: 'Notification not found'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification'
    };
  }
};

// Delete all read notifications older than specified days
export const cleanupOldNotifications = async (
  daysOld: number = 30
): Promise<{ success: boolean; count: number }> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const count = await Notification.destroy({
      where: {
        isRead: true,
        createdAt: { [Op.lt]: cutoffDate }
      }
    });

    return {
      success: true,
      count
    };
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    return {
      success: false,
      count: 0
    };
  }
};

// Get unread count for a user
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    return await Notification.count({
      where: {
        userId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};

// Convenience functions for common notification types

export const notifyPaymentReceived = (
  userId: string,
  tenantName: string,
  amount: number,
  paymentId: string
) =>
  createNotification({
    userId,
    type: 'payment_received',
    title: 'Payment Received',
    message: `Payment of ${amount.toLocaleString()} RWF received from ${tenantName}`,
    priority: 'normal',
    entityType: 'payment',
    entityId: paymentId,
    actionUrl: `/payments/${paymentId}`
  });

export const notifyPaymentOverdue = (
  userId: string,
  tenantName: string,
  amount: number,
  tenantId: string
) =>
  createNotification({
    userId,
    type: 'payment_overdue',
    title: 'Payment Overdue',
    message: `${tenantName} has an overdue payment of ${amount.toLocaleString()} RWF`,
    priority: 'high',
    entityType: 'tenant',
    entityId: tenantId,
    actionUrl: `/tenants/${tenantId}`
  });

export const notifyLeaseExpiring = (
  userId: string,
  tenantName: string,
  daysRemaining: number,
  tenantId: string
) =>
  createNotification({
    userId,
    type: 'lease_expiry',
    title: 'Lease Expiring Soon',
    message: `${tenantName}'s lease expires in ${daysRemaining} days`,
    priority: daysRemaining <= 7 ? 'high' : 'normal',
    entityType: 'lease',
    entityId: tenantId,
    actionUrl: `/tenants/${tenantId}`
  });

export const notifyMaintenanceUpdate = (
  userId: string,
  ticketId: string,
  status: string,
  description: string
) =>
  createNotification({
    userId,
    type: 'maintenance_update',
    title: 'Maintenance Update',
    message: `Ticket #${ticketId.slice(-8).toUpperCase()}: ${description} - Status: ${status}`,
    priority: status === 'urgent' ? 'urgent' : 'normal',
    entityType: 'maintenance',
    entityId: ticketId,
    actionUrl: `/maintenance/${ticketId}`
  });

export const notifyNewTenant = (
  userId: string,
  tenantName: string,
  propertyName: string,
  tenantId: string
) =>
  createNotification({
    userId,
    type: 'tenant_added',
    title: 'New Tenant Added',
    message: `${tenantName} has been added to ${propertyName}`,
    priority: 'normal',
    entityType: 'tenant',
    entityId: tenantId,
    actionUrl: `/tenants/${tenantId}`
  });

export const sendAnnouncement = async (
  userIds: string[],
  title: string,
  message: string,
  priority: NotificationPriority = 'normal'
) =>
  createBulkNotifications(userIds, {
    type: 'announcement',
    title,
    message,
    priority
  });

export default {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  getUnreadCount,
  // Convenience functions
  notifyPaymentReceived,
  notifyPaymentOverdue,
  notifyLeaseExpiring,
  notifyMaintenanceUpdate,
  notifyNewTenant,
  sendAnnouncement
};
