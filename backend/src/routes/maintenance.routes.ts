import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  parsePagination,
  sendPaginated,
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendServerError,
  sendDeleted
} from '../utils/response.utils';
import { uploadMultiple, uploadMultipleToCloudinary, deleteFromCloudinary } from '../services/upload.service';
const { MaintenanceTicket, Unit, Property, Tenant } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /maintenance - List all maintenance tickets (with pagination)
// Super admin can see all maintenance tickets
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, unitId, category, search } = req.query;
    const pagination = parsePagination(req.query);

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (unitId) whereClause.unitId = unitId;
    if (category) whereClause.category = category;

    // Add search in description
    if (search) {
      const { Op } = require('sequelize');
      whereClause.description = { [Op.iLike]: `%${search}%` };
    }

    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const { count, rows: tickets } = await MaintenanceTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber'],
          include: [{
            model: Property,
            as: 'property',
            where: propertyWhere,
            attributes: ['id', 'name', 'address']
          }]
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: pagination.limit,
      offset: pagination.offset
    });

    return sendPaginated(res, tickets, count, pagination);
  } catch (error) {
    console.error('Get maintenance tickets error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch maintenance tickets');
  }
});

// GET /maintenance/stats - Get maintenance statistics
// Super admin can see all stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { Op } = require('sequelize');

    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    // Get all units for accessible properties
    const userUnits = await Unit.findAll({
      include: [{
        model: Property,
        as: 'property',
        where: propertyWhere,
        attributes: []
      }],
      attributes: ['id']
    });

    const unitIds = userUnits.map((u: any) => u.id);

    const [pending, inProgress, completed, urgent] = await Promise.all([
      MaintenanceTicket.count({ where: { unitId: { [Op.in]: unitIds }, status: 'pending' } }),
      MaintenanceTicket.count({ where: { unitId: { [Op.in]: unitIds }, status: 'in_progress' } }),
      MaintenanceTicket.count({ where: { unitId: { [Op.in]: unitIds }, status: 'completed' } }),
      MaintenanceTicket.count({ where: { unitId: { [Op.in]: unitIds }, priority: 'urgent', status: { [Op.notIn]: ['completed', 'cancelled'] } } })
    ]);

    return sendSuccess(res, {
      pending,
      inProgress,
      completed,
      urgent,
      total: pending + inProgress + completed
    });
  } catch (error) {
    console.error('Get maintenance stats error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch maintenance statistics');
  }
});

// GET /maintenance/:id - Get a single maintenance ticket
// Super admin can view any ticket
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [{
            model: Property,
            as: 'property',
            where: propertyWhere,
            attributes: ['id', 'name', 'address']
          }]
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
        }
      ]
    });

    if (!ticket) {
      return sendNotFound(res, 'Maintenance ticket');
    }

    return sendSuccess(res, ticket);
  } catch (error) {
    console.error('Get maintenance ticket error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch maintenance ticket');
  }
});

// POST /maintenance - Create a new maintenance ticket
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { unitId, tenantId, category, description, priority } = req.body;

    if (!unitId || !category || !description) {
      return sendError(res, 'Unit ID, category, and description are required');
    }

    // Verify user has access to unit (super_admin can access all)
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const unit = await Unit.findByPk(unitId, {
      include: [{
        model: Property,
        as: 'property',
        where: propertyWhere
      }]
    });

    if (!unit) {
      return sendNotFound(res, 'Unit');
    }

    // If tenantId is provided, verify user has access
    if (tenantId) {
      const tenantWhere: any = { id: tenantId };
      if (req.user?.role !== 'super_admin') {
        tenantWhere.userId = req.user?.userId;
      }

      const tenant = await Tenant.findOne({ where: tenantWhere });

      if (!tenant) {
        return sendNotFound(res, 'Tenant');
      }
    }

    const ticket = await MaintenanceTicket.create({
      unitId,
      tenantId: tenantId || null,
      category,
      description,
      priority: priority || 'medium',
      status: 'pending'
    });

    return sendCreated(res, ticket, 'Maintenance ticket created successfully');
  } catch (error) {
    console.error('Create maintenance ticket error:', error);
    return sendServerError(res, error as Error, 'Failed to create maintenance ticket');
  }
});

// PUT /maintenance/:id - Update a maintenance ticket
// Super admin can update any ticket
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: propertyWhere
        }]
      }]
    });

    if (!ticket) {
      return sendNotFound(res, 'Maintenance ticket');
    }

    const { category, description, priority, status, assignedTo } = req.body;

    const updateData: any = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    await ticket.update(updateData);

    return sendSuccess(res, ticket, 'Maintenance ticket updated successfully');
  } catch (error) {
    console.error('Update maintenance ticket error:', error);
    return sendServerError(res, error as Error, 'Failed to update maintenance ticket');
  }
});

// POST /maintenance/:id/attachments - Upload attachments to a maintenance ticket
// Super admin can upload to any ticket
router.post('/:id/attachments', uploadMultiple.array('files', 5), async (req: AuthRequest, res: Response) => {
  try {
    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: propertyWhere
        }]
      }]
    });

    if (!ticket) {
      return sendNotFound(res, 'Maintenance ticket');
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, 'No files uploaded');
    }

    // Upload files to cloud storage
    const uploadResult = await uploadMultipleToCloudinary(files, 'maintenance');

    if (!uploadResult.success) {
      return sendError(res, 'Failed to upload files');
    }

    // Add new attachments to existing ones
    const existingAttachments = ticket.attachments || [];
    const newAttachments = [...existingAttachments, ...uploadResult.files];

    await ticket.update({ attachments: newAttachments });

    return sendSuccess(res, {
      attachments: newAttachments,
      uploaded: uploadResult.files.length
    }, 'Files uploaded successfully');
  } catch (error) {
    console.error('Upload attachments error:', error);
    return sendServerError(res, error as Error, 'Failed to upload attachments');
  }
});

// DELETE /maintenance/:id/attachments/:publicId - Remove an attachment from a maintenance ticket
// Super admin can remove from any ticket
router.delete('/:id/attachments/:publicId', async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: propertyWhere
        }]
      }]
    });

    if (!ticket) {
      return sendNotFound(res, 'Maintenance ticket');
    }

    // Find and remove the attachment
    const attachments = ticket.attachments || [];
    const attachmentIndex = attachments.findIndex((a: any) => a.publicId === publicId);

    if (attachmentIndex === -1) {
      return sendNotFound(res, 'Attachment');
    }

    // Delete from cloud storage
    await deleteFromCloudinary(publicId);

    // Remove from ticket
    attachments.splice(attachmentIndex, 1);
    await ticket.update({ attachments });

    return sendSuccess(res, { attachments }, 'Attachment removed successfully');
  } catch (error) {
    console.error('Delete attachment error:', error);
    return sendServerError(res, error as Error, 'Failed to delete attachment');
  }
});

// DELETE /maintenance/:id - Delete a maintenance ticket
// Super admin can delete any ticket
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Build property where clause - super_admin can access all
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: propertyWhere
        }]
      }]
    });

    if (!ticket) {
      return sendNotFound(res, 'Maintenance ticket');
    }

    // Delete all attachments from cloud storage
    const attachments = ticket.attachments || [];
    for (const attachment of attachments) {
      await deleteFromCloudinary(attachment.publicId);
    }

    await ticket.destroy();

    return sendDeleted(res, 'Maintenance ticket deleted successfully');
  } catch (error) {
    console.error('Delete maintenance ticket error:', error);
    return sendServerError(res, error as Error, 'Failed to delete maintenance ticket');
  }
});

export default router;
