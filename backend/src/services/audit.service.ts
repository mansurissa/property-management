/**
 * Audit Trail Service
 * Log all important actions with timestamps for accountability and dispute resolution
 */

const db = require('../database/models');
const { AuditLog, User } = db;
const { Op } = require('sequelize');

export type AuditAction =
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_reset'
  | 'user.password_change'

  // User Management
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.deactivate'
  | 'user.reactivate'

  // Property Management
  | 'property.create'
  | 'property.update'
  | 'property.delete'
  | 'property.restore'
  | 'property.transfer'

  // Unit Management
  | 'unit.create'
  | 'unit.update'
  | 'unit.delete'
  | 'unit.status_change'

  // Tenant Management
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.delete'
  | 'tenant.status_change'
  | 'tenant.lease_start'
  | 'tenant.lease_end'
  | 'tenant.eviction'

  // Payment Management
  | 'payment.record'
  | 'payment.update'
  | 'payment.delete'
  | 'payment.receipt_generated'

  // Maintenance
  | 'maintenance.create'
  | 'maintenance.update'
  | 'maintenance.status_change'
  | 'maintenance.assign'
  | 'maintenance.complete'
  | 'maintenance.cancel'

  // Documents
  | 'document.upload'
  | 'document.delete'
  | 'document.view'

  // Managers
  | 'manager.invite'
  | 'manager.remove'
  | 'manager.permissions_change'

  // Notifications
  | 'notification.payment_reminder'
  | 'notification.late_notice'
  | 'notification.lease_expiry'

  // Reports
  | 'report.generate'
  | 'report.export'

  // System
  | 'system.settings_change'
  | 'system.data_export'
  | 'system.data_import';

export type AuditEntityType =
  | 'user'
  | 'property'
  | 'unit'
  | 'tenant'
  | 'payment'
  | 'maintenance'
  | 'document'
  | 'manager'
  | 'report'
  | 'system';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogResult {
  success: boolean;
  logId?: string;
  error?: string;
}

export interface AuditQueryOptions {
  userId?: string;
  action?: AuditAction | AuditAction[];
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Create audit log entry
export const logAction = async (entry: AuditLogEntry): Promise<AuditLogResult> => {
  try {
    const log = await AuditLog.create({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      description: entry.description,
      metadata: entry.metadata || {},
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null
    });

    return {
      success: true,
      logId: log.id
    };
  } catch (error) {
    console.error('Audit log error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create audit log'
    };
  }
};

// Query audit logs
export const getAuditLogs = async (
  options: AuditQueryOptions
): Promise<{ success: boolean; logs: any[]; total: number }> => {
  try {
    const whereClause: any = {};

    if (options.userId) {
      whereClause.userId = options.userId;
    }

    if (options.action) {
      if (Array.isArray(options.action)) {
        whereClause.action = { [Op.in]: options.action };
      } else {
        whereClause.action = options.action;
      }
    }

    if (options.entityType) {
      whereClause.entityType = options.entityType;
    }

    if (options.entityId) {
      whereClause.entityId = options.entityId;
    }

    if (options.startDate || options.endDate) {
      whereClause.createdAt = {};
      if (options.startDate) {
        whereClause.createdAt[Op.gte] = options.startDate;
      }
      if (options.endDate) {
        whereClause.createdAt[Op.lte] = options.endDate;
      }
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    return {
      success: true,
      logs,
      total: count
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return {
      success: false,
      logs: [],
      total: 0
    };
  }
};

// Get audit trail for a specific entity
export const getEntityAuditTrail = async (
  entityType: AuditEntityType,
  entityId: string,
  limit: number = 50
): Promise<{ success: boolean; logs: any[] }> => {
  try {
    const logs = await AuditLog.findAll({
      where: {
        entityType,
        entityId
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });

    return {
      success: true,
      logs
    };
  } catch (error) {
    console.error('Get entity audit trail error:', error);
    return {
      success: false,
      logs: []
    };
  }
};

// Get user activity log
export const getUserActivity = async (
  userId: string,
  days: number = 30,
  limit: number = 100
): Promise<{ success: boolean; logs: any[] }> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AuditLog.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: startDate }
      },
      order: [['createdAt', 'DESC']],
      limit
    });

    return {
      success: true,
      logs
    };
  } catch (error) {
    console.error('Get user activity error:', error);
    return {
      success: false,
      logs: []
    };
  }
};

// Get audit summary/statistics
export const getAuditSummary = async (
  userId?: string,
  days: number = 30
): Promise<{
  success: boolean;
  summary: {
    totalActions: number;
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
    recentActivity: any[];
  };
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause: any = {
      createdAt: { [Op.gte]: startDate }
    };

    if (userId) {
      whereClause.userId = userId;
    }

    // Get counts by action
    const actionCounts = await AuditLog.findAll({
      where: whereClause,
      attributes: [
        'action',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Get counts by entity type
    const entityCounts = await AuditLog.findAll({
      where: whereClause,
      attributes: [
        'entityType',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['entityType'],
      raw: true
    });

    // Get recent activity
    const recentActivity = await AuditLog.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Process counts
    const byAction: Record<string, number> = {};
    actionCounts.forEach((row: any) => {
      byAction[row.action] = parseInt(row.count, 10);
    });

    const byEntityType: Record<string, number> = {};
    entityCounts.forEach((row: any) => {
      byEntityType[row.entityType] = parseInt(row.count, 10);
    });

    const totalActions = Object.values(byAction).reduce((a, b) => a + b, 0);

    return {
      success: true,
      summary: {
        totalActions,
        byAction,
        byEntityType,
        recentActivity
      }
    };
  } catch (error) {
    console.error('Get audit summary error:', error);
    return {
      success: false,
      summary: {
        totalActions: 0,
        byAction: {},
        byEntityType: {},
        recentActivity: []
      }
    };
  }
};

// Convenience functions for common audit actions

export const logLogin = (userId: string, ipAddress?: string, userAgent?: string) =>
  logAction({
    userId,
    action: 'user.login',
    entityType: 'user',
    entityId: userId,
    description: 'User logged in',
    ipAddress,
    userAgent
  });

export const logLogout = (userId: string) =>
  logAction({
    userId,
    action: 'user.logout',
    entityType: 'user',
    entityId: userId,
    description: 'User logged out'
  });

export const logPaymentRecorded = (
  userId: string,
  paymentId: string,
  tenantName: string,
  amount: number
) =>
  logAction({
    userId,
    action: 'payment.record',
    entityType: 'payment',
    entityId: paymentId,
    description: `Payment of ${amount.toLocaleString()} RWF recorded for ${tenantName}`,
    metadata: { amount, tenantName }
  });

export const logMaintenanceStatusChange = (
  userId: string,
  ticketId: string,
  oldStatus: string,
  newStatus: string
) =>
  logAction({
    userId,
    action: 'maintenance.status_change',
    entityType: 'maintenance',
    entityId: ticketId,
    description: `Maintenance ticket status changed from ${oldStatus} to ${newStatus}`,
    metadata: { oldStatus, newStatus }
  });

export const logTenantCreated = (
  userId: string,
  tenantId: string,
  tenantName: string,
  propertyName: string
) =>
  logAction({
    userId,
    action: 'tenant.create',
    entityType: 'tenant',
    entityId: tenantId,
    description: `New tenant ${tenantName} added to ${propertyName}`,
    metadata: { tenantName, propertyName }
  });

export const logDocumentUploaded = (
  userId: string,
  documentId: string,
  documentName: string,
  entityType: string,
  entityId: string
) =>
  logAction({
    userId,
    action: 'document.upload',
    entityType: 'document',
    entityId: documentId,
    description: `Document "${documentName}" uploaded`,
    metadata: { documentName, relatedEntityType: entityType, relatedEntityId: entityId }
  });

export const logPropertyCreated = (
  userId: string,
  propertyId: string,
  propertyName: string
) =>
  logAction({
    userId,
    action: 'property.create',
    entityType: 'property',
    entityId: propertyId,
    description: `Property "${propertyName}" created`,
    metadata: { propertyName }
  });

export const logReportGenerated = (
  userId: string,
  reportType: string,
  parameters?: Record<string, any>
) =>
  logAction({
    userId,
    action: 'report.generate',
    entityType: 'report',
    description: `Generated ${reportType} report`,
    metadata: { reportType, parameters }
  });

export default {
  logAction,
  getAuditLogs,
  getEntityAuditTrail,
  getUserActivity,
  getAuditSummary,
  // Convenience functions
  logLogin,
  logLogout,
  logPaymentRecorded,
  logMaintenanceStatusChange,
  logTenantCreated,
  logDocumentUploaded,
  logPropertyCreated,
  logReportGenerated
};
