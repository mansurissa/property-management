import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { MaintenanceTicket, Unit, Property, Tenant } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /maintenance - List all maintenance tickets
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, unitId } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (unitId) whereClause.unitId = unitId;

    const tickets = await MaintenanceTicket.findAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber'],
          include: [{
            model: Property,
            as: 'property',
            where: { userId: req.user?.userId },
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
      ]
    });

    return res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Get maintenance tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance tickets'
    });
  }
});

// GET /maintenance/:id - Get a single maintenance ticket
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [{
            model: Property,
            as: 'property',
            where: { userId: req.user?.userId },
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
      return res.status(404).json({
        success: false,
        message: 'Maintenance ticket not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get maintenance ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance ticket'
    });
  }
});

// POST /maintenance - Create a new maintenance ticket
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { unitId, tenantId, category, description, priority } = req.body;

    if (!unitId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Unit ID, category, and description are required'
      });
    }

    // Verify the unit belongs to the user
    const unit = await Unit.findByPk(unitId, {
      include: [{
        model: Property,
        as: 'property',
        where: { userId: req.user?.userId }
      }]
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // If tenantId is provided, verify it
    if (tenantId) {
      const tenant = await Tenant.findOne({
        where: {
          id: tenantId,
          userId: req.user?.userId
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
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

    return res.status(201).json({
      success: true,
      data: ticket,
      message: 'Maintenance ticket created successfully'
    });
  } catch (error) {
    console.error('Create maintenance ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create maintenance ticket'
    });
  }
});

// PUT /maintenance/:id - Update a maintenance ticket
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user?.userId }
        }]
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance ticket not found'
      });
    }

    const { category, description, priority, status } = req.body;

    const updateData: any = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    await ticket.update(updateData);

    return res.status(200).json({
      success: true,
      data: ticket,
      message: 'Maintenance ticket updated successfully'
    });
  } catch (error) {
    console.error('Update maintenance ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update maintenance ticket'
    });
  }
});

// DELETE /maintenance/:id - Delete a maintenance ticket
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await MaintenanceTicket.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user?.userId }
        }]
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance ticket not found'
      });
    }

    await ticket.destroy();

    return res.status(200).json({
      success: true,
      message: 'Maintenance ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete maintenance ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance ticket'
    });
  }
});

export default router;
