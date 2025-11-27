import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, authorizeTenant, AuthRequest } from '../middleware/auth.middleware';
const { User, Property, Unit, Tenant, Payment, MaintenanceTicket, sequelize } = require('../database/models');

const router = Router();

// All routes require authentication and tenant role
router.use(authenticate);
router.use(authorizeTenant);

// GET /tenant-portal/profile - Get tenant's own profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const tenant = await Tenant.findOne({
      where: { userAccountId: userId },
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          attributes: ['name', 'address', 'city']
        }]
      }]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Get tenant profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant profile'
    });
  }
});

// GET /tenant-portal/dashboard - Get tenant dashboard data
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const tenant = await Tenant.findOne({
      where: { userAccountId: userId },
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          attributes: ['name', 'address', 'city']
        }]
      }]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant profile not found'
      });
    }

    // Get payment history
    const payments = await Payment.findAll({
      where: { tenantId: tenant.id },
      order: [['paymentDate', 'DESC']],
      limit: 10
    });

    // Get current month payment status
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthPayment = await Payment.findOne({
      where: {
        tenantId: tenant.id,
        periodMonth: currentMonth,
        periodYear: currentYear
      }
    });

    // Get maintenance tickets
    const maintenanceTickets = await MaintenanceTicket.findAll({
      where: { tenantId: tenant.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Calculate payment summary
    const totalPaid = payments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        profile: tenant,
        unit: tenant.unit,
        property: tenant.unit?.property,
        currentMonthPaid: !!currentMonthPayment,
        rentAmount: tenant.unit?.rentAmount || 0,
        totalPaid,
        recentPayments: payments,
        maintenanceTickets,
        currentPeriod: {
          month: currentMonth,
          year: currentYear
        }
      }
    });
  } catch (error) {
    console.error('Get tenant dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// GET /tenant-portal/payments - Get tenant's payment history
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const tenant = await Tenant.findOne({
      where: { userAccountId: userId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant profile not found'
      });
    }

    const { count, rows } = await Payment.findAndCountAll({
      where: { tenantId: tenant.id },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['name']
        }]
      }],
      order: [['paymentDate', 'DESC']],
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
    console.error('Get tenant payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// GET /tenant-portal/maintenance - Get tenant's maintenance tickets
router.get('/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const tenant = await Tenant.findOne({
      where: { userAccountId: userId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant profile not found'
      });
    }

    const whereClause: any = { tenantId: tenant.id };
    if (status) whereClause.status = status;

    const { count, rows } = await MaintenanceTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['unitNumber'],
          include: [{
            model: Property,
            as: 'property',
            attributes: ['name']
          }]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['firstName', 'lastName']
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
    console.error('Get tenant maintenance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance tickets'
    });
  }
});

// POST /tenant-portal/maintenance - Create a new maintenance ticket
router.post('/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { category, description, priority } = req.body;

    const tenant = await Tenant.findOne({
      where: { userAccountId: userId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant profile not found'
      });
    }

    if (!tenant.unitId) {
      return res.status(400).json({
        success: false,
        message: 'No unit assigned to this tenant'
      });
    }

    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category and description are required'
      });
    }

    const validCategories = ['plumbing', 'electrical', 'structural', 'appliance', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const ticket = await MaintenanceTicket.create({
      unitId: tenant.unitId,
      tenantId: tenant.id,
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

// GET /tenant-portal/maintenance/:id - Get a specific maintenance ticket
router.get('/maintenance/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const tenant = await Tenant.findOne({
      where: { userAccountId: userId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant profile not found'
      });
    }

    const ticket = await MaintenanceTicket.findOne({
      where: { id, tenantId: tenant.id },
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['unitNumber'],
          include: [{
            model: Property,
            as: 'property',
            attributes: ['name', 'address']
          }]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['firstName', 'lastName', 'phone']
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

export default router;
