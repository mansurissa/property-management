import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { generateReceipt, generateReceiptText, generateReceiptPDF } from '../services/receipt.service';
import { logAction } from '../services/audit.service';
const { Payment, Tenant, Unit, Property, User } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /payments - List all payments with filters
// Super admin can see all payments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, unitId, periodMonth, periodYear, startDate, endDate } = req.query;

    // Build tenant where clause - super_admin can access all
    const tenantWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const whereClause: any = {};
    const includeClause: any[] = [
      {
        model: Tenant,
        as: 'tenant',
        where: tenantWhere,
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
// Super admin can view any payment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Build tenant where clause - super_admin can access all
    const tenantWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          where: tenantWhere,
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

    // Verify user has access to tenant (super_admin can access all)
    const tenantWhere: any = { id: tenantId };
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({ where: tenantWhere });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
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
// Super admin can view any tenant's payments
router.get('/tenant/:tenantId', async (req: AuthRequest, res: Response) => {
  try {
    // Verify user has access to tenant (super_admin can access all)
    const tenantWhere: any = { id: req.params.tenantId };
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({ where: tenantWhere });

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
// Super admin can view any tenant's balance
router.get('/tenant/:tenantId/balance', async (req: AuthRequest, res: Response) => {
  try {
    // Verify user has access to tenant (super_admin can access all)
    const tenantWhere: any = { id: req.params.tenantId };
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({
      where: tenantWhere,
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

// GET /payments/:id/receipt - Generate receipt for a payment
// Super admin can generate receipt for any payment
router.get('/:id/receipt', async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.query; // 'html' or 'text'

    // Build tenant where clause - super_admin can access all
    const tenantWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          where: tenantWhere,
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
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const paymentData = {
      id: payment.id,
      amount: parseFloat(payment.amount),
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      periodMonth: payment.periodMonth,
      periodYear: payment.periodYear,
      notes: payment.notes,
      tenant: {
        firstName: payment.tenant.firstName,
        lastName: payment.tenant.lastName,
        email: payment.tenant.email,
        phone: payment.tenant.phone
      },
      unit: {
        unitNumber: payment.unit.unitNumber,
        property: {
          name: payment.unit.property.name,
          address: payment.unit.property.address
        }
      },
      receivedBy: payment.receiver ? {
        firstName: payment.receiver.firstName,
        lastName: payment.receiver.lastName
      } : undefined
    };

    if (format === 'text') {
      const receiptText = generateReceiptText(paymentData);
      res.setHeader('Content-Type', 'text/plain');
      return res.send(receiptText);
    }

    if (format === 'download') {
      const receipt = generateReceipt(paymentData);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.html"`);
      return res.send(receipt.html);
    }

    if (format === 'pdf') {
      const pdfBuffer = await generateReceiptPDF(paymentData);
      if (!pdfBuffer) {
        // Fallback to HTML if PDF generation is not available
        const receipt = generateReceipt(paymentData);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.html"`);
        return res.send(receipt.html);
      }
      const receipt = generateReceipt(paymentData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`);
      return res.send(pdfBuffer);
    }

    // Default: return JSON with receipt data and HTML
    const receipt = generateReceipt(paymentData);
    return res.status(200).json({
      success: true,
      data: {
        receiptNumber: receipt.receiptNumber,
        generatedAt: receipt.generatedAt,
        html: receipt.html
      }
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
});

// DELETE /payments/:id - Delete a payment
// Super admin can delete any payment
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Build tenant where clause - super_admin can access all
    const tenantWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const payment = await Payment.findByPk(req.params.id, {
      include: [{
        model: Tenant,
        as: 'tenant',
        where: tenantWhere,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Store payment data for audit before deletion
    const paymentData = {
      id: payment.id,
      amount: payment.amount,
      tenantId: payment.tenantId,
      tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
      periodMonth: payment.periodMonth,
      periodYear: payment.periodYear,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod
    };

    await payment.destroy();

    // Log the deletion with full payment details for audit trail
    await logAction({
      userId: req.user!.userId,
      action: 'payment.delete',
      entityType: 'payment',
      entityId: paymentData.id,
      description: `Deleted payment of ${paymentData.amount} RWF for ${paymentData.tenantName} (${paymentData.periodMonth}/${paymentData.periodYear})`,
      metadata: paymentData
    });

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
