import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendServerError, sendError } from '../utils/response.utils';
import { Op, fn, col, literal } from 'sequelize';
const { Property, Unit, Tenant, Payment, MaintenanceTicket } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /reports/overview - Get overall statistics
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all properties for user
    const properties = await Property.findAll({
      where: { userId },
      include: [{
        model: Unit,
        as: 'units',
        include: [{
          model: Tenant,
          as: 'tenants',
          where: { status: 'active' },
          required: false
        }]
      }]
    });

    const propertyIds = properties.map((p: any) => p.id);
    const unitIds = properties.flatMap((p: any) => p.units.map((u: any) => u.id));

    // Calculate stats
    const totalUnits = unitIds.length;
    const occupiedUnits = properties.reduce((sum: number, p: any) =>
      sum + p.units.filter((u: any) => u.status === 'occupied').length, 0);
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Get active tenants count
    const activeTenants = await Tenant.count({
      where: { userId, status: 'active' }
    });

    // Get total monthly rent potential
    const monthlyRentPotential = properties.reduce((sum: number, p: any) =>
      sum + p.units.reduce((uSum: number, u: any) => uSum + parseFloat(u.monthlyRent || 0), 0), 0);

    // Get current month's payments
    const now = new Date();
    const currentMonthPayments = await Payment.sum('amount', {
      where: {
        unitId: { [Op.in]: unitIds },
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear()
      }
    });

    // Get pending maintenance tickets
    const pendingMaintenance = await MaintenanceTicket.count({
      where: {
        unitId: { [Op.in]: unitIds },
        status: { [Op.in]: ['pending', 'in_progress'] }
      }
    });

    return sendSuccess(res, {
      properties: properties.length,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      activeTenants,
      monthlyRentPotential,
      currentMonthCollected: currentMonthPayments || 0,
      collectionRate: monthlyRentPotential > 0
        ? Math.round(((currentMonthPayments || 0) / monthlyRentPotential) * 100)
        : 0,
      pendingMaintenance
    });
  } catch (error) {
    console.error('Get overview report error:', error);
    return sendServerError(res, error as Error, 'Failed to generate overview report');
  }
});

// GET /reports/revenue - Get revenue report
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate, groupBy = 'month' } = req.query;

    // Default to last 12 months
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getFullYear() - 1, end.getMonth(), 1);

    // Get user's units
    const units = await Unit.findAll({
      include: [{
        model: Property,
        as: 'property',
        where: { userId },
        attributes: []
      }],
      attributes: ['id']
    });
    const unitIds = units.map((u: any) => u.id);

    // Get payments grouped by period
    const payments = await Payment.findAll({
      where: {
        unitId: { [Op.in]: unitIds },
        paymentDate: { [Op.between]: [start, end] }
      },
      attributes: [
        'paymentMethod',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
        [fn('DATE_TRUNC', groupBy, col('paymentDate')), 'period']
      ],
      group: [literal(`DATE_TRUNC('${groupBy}', "paymentDate")`), 'paymentMethod'],
      order: [[literal(`DATE_TRUNC('${groupBy}', "paymentDate")`), 'ASC']],
      raw: true
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum: number, p: any) => sum + parseFloat(p.total), 0);
    const paymentCount = payments.reduce((sum: number, p: any) => sum + parseInt(p.count), 0);

    // Group by period for chart data
    const periodMap = new Map<string, any>();
    for (const payment of payments) {
      const p = payment as any;
      const period = new Date(p.period).toISOString().slice(0, 7); // YYYY-MM format
      if (!periodMap.has(period)) {
        periodMap.set(period, { period, total: 0, byMethod: {} });
      }
      const entry = periodMap.get(period);
      entry.total += parseFloat(p.total);
      entry.byMethod[p.paymentMethod] = parseFloat(p.total);
    }

    return sendSuccess(res, {
      totalRevenue,
      paymentCount,
      averagePayment: paymentCount > 0 ? Math.round(totalRevenue / paymentCount) : 0,
      periodData: Array.from(periodMap.values()),
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    return sendServerError(res, error as Error, 'Failed to generate revenue report');
  }
});

// GET /reports/occupancy - Get occupancy report
router.get('/occupancy', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all properties with units
    const properties = await Property.findAll({
      where: { userId },
      include: [{
        model: Unit,
        as: 'units',
        attributes: ['id', 'unitNumber', 'status', 'monthlyRent']
      }],
      attributes: ['id', 'name', 'address', 'type']
    });

    const propertyStats = properties.map((property: any) => {
      const units = property.units || [];
      const occupied = units.filter((u: any) => u.status === 'occupied').length;
      const vacant = units.filter((u: any) => u.status === 'vacant').length;
      const maintenance = units.filter((u: any) => u.status === 'maintenance').length;
      const total = units.length;
      const potentialRent = units.reduce((sum: number, u: any) => sum + parseFloat(u.monthlyRent || 0), 0);
      const actualRent = units
        .filter((u: any) => u.status === 'occupied')
        .reduce((sum: number, u: any) => sum + parseFloat(u.monthlyRent || 0), 0);

      return {
        id: property.id,
        name: property.name,
        address: property.address,
        type: property.type,
        units: {
          total,
          occupied,
          vacant,
          maintenance,
          occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
        },
        revenue: {
          potential: potentialRent,
          actual: actualRent,
          loss: potentialRent - actualRent
        }
      };
    });

    // Calculate totals
    const totals = propertyStats.reduce((acc: any, p: any) => ({
      totalUnits: acc.totalUnits + p.units.total,
      occupiedUnits: acc.occupiedUnits + p.units.occupied,
      vacantUnits: acc.vacantUnits + p.units.vacant,
      potentialRevenue: acc.potentialRevenue + p.revenue.potential,
      actualRevenue: acc.actualRevenue + p.revenue.actual
    }), { totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, potentialRevenue: 0, actualRevenue: 0 });

    totals.overallOccupancyRate = totals.totalUnits > 0
      ? Math.round((totals.occupiedUnits / totals.totalUnits) * 100)
      : 0;
    totals.revenueLoss = totals.potentialRevenue - totals.actualRevenue;

    return sendSuccess(res, {
      properties: propertyStats,
      totals
    });
  } catch (error) {
    console.error('Get occupancy report error:', error);
    return sendServerError(res, error as Error, 'Failed to generate occupancy report');
  }
});

// GET /reports/maintenance - Get maintenance report
router.get('/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

    // Default to last 6 months
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getFullYear(), end.getMonth() - 6, 1);

    // Get user's units
    const units = await Unit.findAll({
      include: [{
        model: Property,
        as: 'property',
        where: { userId },
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'unitNumber']
    });
    const unitIds = units.map((u: any) => u.id);

    // Get tickets by status
    const ticketsByStatus = await MaintenanceTicket.findAll({
      where: {
        unitId: { [Op.in]: unitIds },
        createdAt: { [Op.between]: [start, end] }
      },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get tickets by category
    const ticketsByCategory = await MaintenanceTicket.findAll({
      where: {
        unitId: { [Op.in]: unitIds },
        createdAt: { [Op.between]: [start, end] }
      },
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    // Get tickets by priority
    const ticketsByPriority = await MaintenanceTicket.findAll({
      where: {
        unitId: { [Op.in]: unitIds },
        createdAt: { [Op.between]: [start, end] }
      },
      attributes: [
        'priority',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    // Calculate average resolution time (for completed tickets)
    const completedTickets = await MaintenanceTicket.findAll({
      where: {
        unitId: { [Op.in]: unitIds },
        status: 'completed',
        completedAt: { [Op.not]: null },
        createdAt: { [Op.between]: [start, end] }
      },
      attributes: ['createdAt', 'completedAt'],
      raw: true
    });

    let averageResolutionTime = 0;
    if (completedTickets.length > 0) {
      const totalTime = completedTickets.reduce((sum: number, t: any) => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt).getTime();
        return sum + (completed - created);
      }, 0);
      averageResolutionTime = Math.round(totalTime / completedTickets.length / (1000 * 60 * 60 * 24)); // in days
    }

    // Format status counts
    const statusMap: Record<string, number> = {};
    for (const item of ticketsByStatus as any[]) {
      statusMap[item.status] = parseInt(item.count);
    }

    const totalTickets = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return sendSuccess(res, {
      summary: {
        total: totalTickets,
        pending: statusMap['pending'] || 0,
        inProgress: statusMap['in_progress'] || 0,
        completed: statusMap['completed'] || 0,
        cancelled: statusMap['cancelled'] || 0,
        averageResolutionDays: averageResolutionTime
      },
      byCategory: ticketsByCategory,
      byPriority: ticketsByPriority,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Get maintenance report error:', error);
    return sendServerError(res, error as Error, 'Failed to generate maintenance report');
  }
});

// GET /reports/tenants - Get tenant report
router.get('/tenants', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all tenants with payment history
    const tenants = await Tenant.findAll({
      where: { userId },
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber', 'monthlyRent'],
          include: [{
            model: Property,
            as: 'property',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'paymentDate', 'periodMonth', 'periodYear']
        }
      ]
    });

    // Calculate tenant stats
    const tenantStats = tenants.map((tenant: any) => {
      const payments = tenant.payments || [];
      const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
      const paymentCount = payments.length;
      const monthlyRent = tenant.unit ? parseFloat(tenant.unit.monthlyRent) : 0;

      // Calculate months since lease start
      const leaseStart = tenant.leaseStart ? new Date(tenant.leaseStart) : new Date();
      const now = new Date();
      const monthsRented = Math.max(1,
        (now.getFullYear() - leaseStart.getFullYear()) * 12 +
        (now.getMonth() - leaseStart.getMonth()) + 1
      );

      const expectedPayments = monthsRented * monthlyRent;
      const balance = expectedPayments - totalPaid;

      return {
        id: tenant.id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
        phone: tenant.phone,
        status: tenant.status,
        unit: tenant.unit ? {
          unitNumber: tenant.unit.unitNumber,
          property: tenant.unit.property?.name
        } : null,
        leaseStart: tenant.leaseStart,
        leaseEnd: tenant.leaseEnd,
        financials: {
          monthlyRent,
          totalPaid,
          expectedPayments,
          balance,
          paymentCount,
          paymentRate: expectedPayments > 0 ? Math.round((totalPaid / expectedPayments) * 100) : 100
        }
      };
    });

    // Summary stats
    const activeTenants = tenantStats.filter((t: any) => t.status === 'active');
    const totalBalance = tenantStats.reduce((sum: number, t: any) => sum + Math.max(0, t.financials.balance), 0);

    return sendSuccess(res, {
      tenants: tenantStats,
      summary: {
        total: tenantStats.length,
        active: activeTenants.length,
        inactive: tenantStats.length - activeTenants.length,
        totalOutstandingBalance: totalBalance
      }
    });
  } catch (error) {
    console.error('Get tenant report error:', error);
    return sendServerError(res, error as Error, 'Failed to generate tenant report');
  }
});

// GET /reports/export - Export report data as CSV
router.get('/export/:reportType', async (req: AuthRequest, res: Response) => {
  try {
    const { reportType } = req.params;

    if (!['payments', 'tenants', 'maintenance'].includes(reportType)) {
      return sendError(res, 'Invalid report type. Use: payments, tenants, or maintenance');
    }

    const userId = req.user?.userId;

    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    if (reportType === 'payments') {
      const units = await Unit.findAll({
        include: [{
          model: Property,
          as: 'property',
          where: { userId },
          attributes: []
        }],
        attributes: ['id']
      });
      const unitIds = units.map((u: any) => u.id);

      const payments = await Payment.findAll({
        where: { unitId: { [Op.in]: unitIds } },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['firstName', 'lastName']
          },
          {
            model: Unit,
            as: 'unit',
            attributes: ['unitNumber'],
            include: [{
              model: Property,
              as: 'property',
              attributes: ['name']
            }]
          }
        ],
        order: [['paymentDate', 'DESC']]
      });

      headers = ['Date', 'Tenant', 'Property', 'Unit', 'Amount', 'Method', 'Period'];
      data = payments.map((p: any) => [
        new Date(p.paymentDate).toISOString().split('T')[0],
        `${p.tenant?.firstName || ''} ${p.tenant?.lastName || ''}`.trim(),
        p.unit?.property?.name || '',
        p.unit?.unitNumber || '',
        p.amount,
        p.paymentMethod,
        `${p.periodMonth}/${p.periodYear}`
      ]);
      filename = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Generate CSV
    const csv = [headers.join(','), ...data.map(row => row.map((cell: any) =>
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (error) {
    console.error('Export report error:', error);
    return sendServerError(res, error as Error, 'Failed to export report');
  }
});

export default router;
