import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { Payment, Tenant, Unit, Property } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /payments - List all payments with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, unitId, periodMonth, periodYear, startDate, endDate } = req.query;

    const whereClause: any = {};
    const includeClause: any[] = [
      {
        model: Tenant,
        as: 'tenant',
        where: { userId: req.user?.userId },
        attributes: ['id', 'firstName', 'lastName', 'phone']
      },
      {
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unitNumber', 'monthlyRent'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        }]
      }
    ];

    if (tenantId) whereClause.tenantId = tenantId;
    if (unitId) whereClause.unitId = unitId;
    if (periodMonth) whereClause.periodMonth = periodMonth;
    if (periodYear) whereClause.periodYear = periodYear;

    if (startDate || endDate) {
      whereClause.paymentDate = {};
      if (startDate) whereClause.paymentDate[Op.gte] = startDate;
      if (endDate) whereClause.paymentDate[Op.lte] = endDate;
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: includeClause,
      order: [['paymentDate', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// GET /payments/:id - Get a single payment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          where: { userId: req.user?.userId },
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber', 'monthlyRent'],
          include: [{
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address']
          }]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment'
    });
  }
});

// POST /payments - Record a new payment
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, unitId, amount, paymentMethod, paymentDate, periodMonth, periodYear, notes } = req.body;

    if (!tenantId || !unitId || !amount || !paymentDate || !periodMonth || !periodYear) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID, unit ID, amount, payment date, period month and year are required'
      });
    }

    // Verify the tenant belongs to the user
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

    const payment = await Payment.create({
      tenantId,
      unitId,
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentDate,
      periodMonth,
      periodYear,
      notes,
      receivedBy: req.user?.userId
    });

    // Update tenant status if they were late
    if (tenant.status === 'late') {
      await tenant.update({ status: 'active' });
    }

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
});

// GET /tenants/:tenantId/payments - Get payment history for a tenant
router.get('/tenant/:tenantId', async (req: AuthRequest, res: Response) => {
  try {
    // Verify the tenant belongs to the user
    const tenant = await Tenant.findOne({
      where: {
        id: req.params.tenantId,
        userId: req.user?.userId
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const payments = await Payment.findAll({
      where: { tenantId: req.params.tenantId },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unitNumber', 'monthlyRent']
      }],
      order: [['periodYear', 'DESC'], ['periodMonth', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get tenant payments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant payments'
    });
  }
});

// GET /tenants/:tenantId/balance - Get current balance/arrears for a tenant
router.get('/tenant/:tenantId/balance', async (req: AuthRequest, res: Response) => {
  try {
    // Verify the tenant belongs to the user
    const tenant = await Tenant.findOne({
      where: {
        id: req.params.tenantId,
        userId: req.user?.userId
      },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unitNumber', 'monthlyRent']
      }]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (!tenant.unit) {
      return res.status(200).json({
        success: true,
        data: {
          expectedTotal: 0,
          paidTotal: 0,
          balance: 0,
          monthsOwed: 0
        }
      });
    }

    // Calculate expected rent from lease start to current month
    const leaseStart = tenant.leaseStartDate ? new Date(tenant.leaseStartDate) : new Date();
    const now = new Date();

    let monthsRented = 0;
    const startYear = leaseStart.getFullYear();
    const startMonth = leaseStart.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    monthsRented = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
    if (monthsRented < 0) monthsRented = 0;

    const expectedTotal = monthsRented * parseFloat(tenant.unit.monthlyRent);

    // Calculate total payments
    const payments = await Payment.findAll({
      where: { tenantId: req.params.tenantId },
      attributes: ['amount']
    });

    const paidTotal = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const balance = expectedTotal - paidTotal;
    const monthsOwed = Math.ceil(balance / parseFloat(tenant.unit.monthlyRent));

    return res.status(200).json({
      success: true,
      data: {
        expectedTotal,
        paidTotal,
        balance,
        monthsOwed: monthsOwed > 0 ? monthsOwed : 0,
        monthlyRent: parseFloat(tenant.unit.monthlyRent)
      }
    });
  } catch (error) {
    console.error('Get tenant balance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate tenant balance'
    });
  }
});

// DELETE /payments/:id - Delete a payment
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{
        model: Tenant,
        as: 'tenant',
        where: { userId: req.user?.userId }
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.destroy();

    return res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete payment'
    });
  }
});

export default router;
