import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, authorizeAgency, AuthRequest } from '../middleware/auth.middleware';
const { User, Property, Unit, Tenant, Payment, MaintenanceTicket, sequelize } = require('../database/models');

const router = Router();

// All routes require authentication and agency role
router.use(authenticate);
router.use(authorizeAgency);

// GET /agency/stats - Get agency dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.userId;

    // Get properties managed by this agency
    const properties = await Property.findAll({
      where: { agencyId },
      attributes: ['id']
    });
    const propertyIds = properties.map((p: any) => p.id);
    const totalProperties = properties.length;

    // Get units in managed properties
    const totalUnits = await Unit.count({
      where: { propertyId: { [Op.in]: propertyIds } }
    });

    const occupiedUnits = await Unit.count({
      where: {
        propertyId: { [Op.in]: propertyIds },
        status: 'occupied'
      }
    });

    const vacantUnits = await Unit.count({
      where: {
        propertyId: { [Op.in]: propertyIds },
        status: 'vacant'
      }
    });

    // Get owners for managed properties
    const ownerIds = await Property.findAll({
      where: { agencyId },
      attributes: ['userId'],
      group: ['userId']
    });

    // Get current month's revenue from managed properties
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const units = await Unit.findAll({
      where: { propertyId: { [Op.in]: propertyIds } },
      attributes: ['id']
    });
    const unitIds = units.map((u: any) => u.id);

    const monthlyPayments = await Payment.findAll({
      where: {
        periodMonth: currentMonth,
        periodYear: currentYear
      },
      include: [{
        model: Unit,
        as: 'unit',
        where: { id: { [Op.in]: unitIds } },
        attributes: []
      }],
      attributes: ['amount']
    });

    const totalRevenue = monthlyPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount),
      0
    );

    // Get pending maintenance for managed properties
    const pendingMaintenance = await MaintenanceTicket.count({
      where: {
        unitId: { [Op.in]: unitIds },
        status: { [Op.in]: ['pending', 'in_progress'] }
      }
    });

    // Get recent payments
    const recentPayments = await Payment.findAll({
      include: [
        {
          model: Tenant,
          as: 'tenant',
          required: true,
          attributes: ['firstName', 'lastName']
        },
        {
          model: Unit,
          as: 'unit',
          required: true,
          where: { propertyId: { [Op.in]: propertyIds } },
          attributes: ['unitNumber'],
          include: [{
            model: Property,
            as: 'property',
            required: true,
            attributes: ['name']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get recent maintenance tickets
    const recentMaintenance = await MaintenanceTicket.findAll({
      include: [{
        model: Unit,
        as: 'unit',
        required: true,
        where: { propertyId: { [Op.in]: propertyIds } },
        attributes: ['unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          required: true,
          attributes: ['name']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProperties,
          totalUnits,
          occupiedUnits,
          vacantUnits,
          occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalOwners: ownerIds.length,
          totalRevenue,
          pendingMaintenance
        },
        recentPayments,
        recentMaintenance,
        currentPeriod: {
          month: currentMonth,
          year: currentYear
        }
      }
    });
  } catch (error) {
    console.error('Get agency stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agency statistics'
    });
  }
});

// GET /agency/properties - Get all properties managed by this agency
router.get('/properties', async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Property.findAndCountAll({
      where: { agencyId },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unitNumber', 'status', 'rentAmount']
        }
      ],
      order: [['createdAt', 'DESC']],
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
    console.error('Get agency properties error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
});

// GET /agency/owners - Get all owners associated with this agency
router.get('/owners', async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.userId;

    // Get unique owners from managed properties
    const properties = await Property.findAll({
      where: { agencyId },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }],
      attributes: ['userId']
    });

    // Get unique owners
    const ownerMap = new Map();
    properties.forEach((p: any) => {
      if (p.owner && !ownerMap.has(p.owner.id)) {
        ownerMap.set(p.owner.id, p.owner);
      }
    });

    const owners = Array.from(ownerMap.values());

    return res.status(200).json({
      success: true,
      data: owners
    });
  } catch (error) {
    console.error('Get agency owners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owners'
    });
  }
});

// GET /agency/maintenance - Get all maintenance tickets for managed properties
router.get('/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.userId;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const properties = await Property.findAll({
      where: { agencyId },
      attributes: ['id']
    });
    const propertyIds = properties.map((p: any) => p.id);

    const whereClause: any = {};
    if (status) whereClause.status = status;

    const { count, rows } = await MaintenanceTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'unit',
          required: true,
          where: { propertyId: { [Op.in]: propertyIds } },
          attributes: ['unitNumber'],
          include: [{
            model: Property,
            as: 'property',
            attributes: ['name']
          }]
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['firstName', 'lastName', 'phone']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
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
    console.error('Get agency maintenance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance tickets'
    });
  }
});

// PUT /agency/maintenance/:id/assign - Assign a maintenance ticket to staff
router.put('/maintenance/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const agencyId = req.user?.userId;

    const ticket = await MaintenanceTicket.findByPk(id, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property'
        }]
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance ticket not found'
      });
    }

    // Verify the ticket belongs to a property managed by this agency
    if (ticket.unit?.property?.agencyId !== agencyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this ticket'
      });
    }

    // Verify the assignee is maintenance staff
    if (assignedTo) {
      const staff = await User.findOne({
        where: { id: assignedTo, role: 'maintenance' }
      });
      if (!staff) {
        return res.status(400).json({
          success: false,
          message: 'Invalid maintenance staff member'
        });
      }
    }

    await ticket.update({
      assignedTo,
      status: assignedTo ? 'in_progress' : ticket.status
    });

    return res.status(200).json({
      success: true,
      data: ticket,
      message: 'Ticket assigned successfully'
    });
  } catch (error) {
    console.error('Assign maintenance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket'
    });
  }
});

export default router;
