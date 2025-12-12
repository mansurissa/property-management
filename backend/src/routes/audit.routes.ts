import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware';
import {
  getAuditLogs,
  getEntityAuditTrail,
  getUserActivity,
  getAuditSummary,
  AuditAction,
  AuditEntityType
} from '../services/audit.service';
import {
  sendSuccess,
  sendPaginated,
  sendServerError,
  parsePagination
} from '../utils/response.utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /audit - Get audit logs (with filters)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { action, entityType, entityId, startDate, endDate } = req.query;
    const pagination = parsePagination(req.query);

    const result = await getAuditLogs({
      userId: req.user!.userId,
      action: action as AuditAction,
      entityType: entityType as AuditEntityType,
      entityId: entityId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: pagination.limit,
      offset: pagination.offset
    });

    return sendPaginated(res, result.logs, result.total, pagination);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch audit logs');
  }
});

// GET /audit/summary - Get audit summary/statistics
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;

    const result = await getAuditSummary(req.user!.userId, parseInt(days as string, 10));

    return sendSuccess(res, result.summary);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch audit summary');
  }
});

// GET /audit/activity - Get current user's recent activity
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30', limit = '100' } = req.query;

    const result = await getUserActivity(
      req.user!.userId,
      parseInt(days as string, 10),
      parseInt(limit as string, 10)
    );

    return sendSuccess(res, { activity: result.logs });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch user activity');
  }
});

// GET /audit/entity/:entityType/:entityId - Get audit trail for a specific entity
router.get('/entity/:entityType/:entityId', async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = '50' } = req.query;

    const result = await getEntityAuditTrail(
      entityType as AuditEntityType,
      entityId,
      parseInt(limit as string, 10)
    );

    return sendSuccess(res, { trail: result.logs });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch entity audit trail');
  }
});

// GET /audit/all - Get all audit logs (super_admin only)
router.get('/all', requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, entityType, entityId, startDate, endDate } = req.query;
    const pagination = parsePagination(req.query);

    const result = await getAuditLogs({
      userId: userId as string,
      action: action as AuditAction,
      entityType: entityType as AuditEntityType,
      entityId: entityId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: pagination.limit,
      offset: pagination.offset
    });

    return sendPaginated(res, result.logs, result.total, pagination);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch audit logs');
  }
});

// GET /audit/all/summary - Get system-wide audit summary (super_admin only)
router.get('/all/summary', requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;

    const result = await getAuditSummary(undefined, parseInt(days as string, 10));

    return sendSuccess(res, result.summary);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch audit summary');
  }
});

export default router;
