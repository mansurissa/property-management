import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, authorizeMaintenance, AuthRequest } from '../middleware/auth.middleware';
const { User, Property, Unit, Tenant, MaintenanceTicket, sequelize } = require('../database/models');

const router = Router();

// All routes require authentication and maintenance role
router.use(authenticate);
router.use(authorizeMaintenance);

// GET /maintenance-staff/dashboard - Get maintenance staff dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get tickets assigned to this staff member
    const assignedTickets = await MaintenanceTicket.count({
      where: { assignedTo: userId }
    });

    const pendingTickets = await MaintenanceTicket.count({
      where: { assignedTo: userId, status: 'pending' }
    });

    const inProgressTickets = await MaintenanceTicket.count({
      where: { assignedTo: userId, status: 'in_progress' }
    });

    const completedTickets = await MaintenanceTicket.count({
      where: { assignedTo: userId, status: 'completed' }
    });

    // Get tickets completed this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedThisMonth = await MaintenanceTicket.count({
      where: {
        assignedTo: userId,
        status: 'completed',
        completedAt: { [Op.gte]: startOfMonth }
      }
    });

    // Get recent assigned tickets
    const recentTickets = await MaintenanceTicket.findAll({
      where: { assignedTo: userId },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['name', 'address']
        }]
      }, {
        model: Tenant,
        as: 'tenant',
        attributes: ['firstName', 'lastName', 'phone']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get tickets by category
    const ticketsByCategory = await MaintenanceTicket.findAll({
      where: { assignedTo: userId },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category']
    });

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          assignedTickets,
          pendingTickets,
          inProgressTickets,
          completedTickets,
          completedThisMonth
        },
        recentTickets,
        ticketsByCategory,
        currentPeriod: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      }
    });
  } catch (error) {
    console.error('Get maintenance dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// GET /maintenance-staff/tickets - Get all tickets assigned to this staff member
router.get('/tickets', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const whereClause: any = { assignedTo: userId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const { count, rows } = await MaintenanceTicket.findAndCountAll({
      where: whereClause,
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['name', 'address', 'city']
        }]
      }, {
        model: Tenant,
        as: 'tenant',
        attributes: ['firstName', 'lastName', 'phone', 'email']
      }],
      order: [
        [sequelize.literal(`CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`), 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get maintenance tickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
});

// GET /maintenance-staff/tickets/:id - Get a specific ticket
router.get('/tickets/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const ticket = await MaintenanceTicket.findOne({
      where: { id, assignedTo: userId },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['unitNumber', 'floor'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['name', 'address', 'city', 'type']
        }]
      }, {
        model: Tenant,
        as: 'tenant',
        attributes: ['firstName', 'lastName', 'phone', 'email']
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or not assigned to you'
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
});

// PUT /maintenance-staff/tickets/:id/status - Update ticket status
router.put('/tickets/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ticket = await MaintenanceTicket.findOne({
      where: { id, assignedTo: userId }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or not assigned to you'
      });
    }

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await ticket.update(updateData);

    return res.status(200).json({
      success: true,
      data: ticket,
      message: 'Ticket status updated successfully'
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status'
    });
  }
});

// GET /maintenance-staff/profile - Get maintenance staff profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get stats
    const totalCompleted = await MaintenanceTicket.count({
      where: { assignedTo: userId, status: 'completed' }
    });

    const totalAssigned = await MaintenanceTicket.count({
      where: { assignedTo: userId }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        stats: {
          totalCompleted,
          totalAssigned
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

export default router;
