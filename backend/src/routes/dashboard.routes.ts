import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { Property, Unit, Tenant, Payment, MaintenanceTicket, sequelize } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /dashboard/stats - Get dashboard statistics (optimized with parallel queries)
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // First, get property IDs (needed for subsequent queries)
    const properties = await Property.findAll({
      where: { userId },
      attributes: ['id']
    });
    const propertyIds = properties.map((p: any) => p.id);
    const totalProperties = properties.length;

    // Run all independent queries in parallel for better performance
    const [
      unitStats,
      tenantStats,
      monthlyPaymentsResult,
      pendingMaintenance,
      recentPayments,
      recentMaintenance
    ] = await Promise.all([
      // Unit statistics - single query with grouping
      Unit.findAll({
        where: { propertyId: { [Op.in]: propertyIds } },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      }),

      // Tenant statistics - single query with grouping
      Tenant.findAll({
        where: { userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      }),

      // Monthly revenue - use SUM instead of fetching all records
      Payment.findOne({
        where: {
          periodMonth: currentMonth,
          periodYear: currentYear
        },
        include: [{
          model: Tenant,
          as: 'tenant',
          where: { userId },
          attributes: []
        }],
        attributes: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Payment.amount')), 0), 'totalRevenue']
        ],
        raw: true
      }),

      // Pending maintenance count
      MaintenanceTicket.count({
        include: [{
          model: Unit,
          as: 'unit',
          required: true,
          include: [{
            model: Property,
            as: 'property',
            where: { userId },
            required: true
          }]
        }],
        where: {
          status: { [Op.in]: ['pending', 'in_progress'] }
        }
      }),

      // Recent payments
      Payment.findAll({
        include: [
          {
            model: Tenant,
            as: 'tenant',
            required: true,
            where: { userId },
            attributes: ['firstName', 'lastName']
          },
          {
            model: Unit,
            as: 'unit',
            required: true,
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
      }),

      // Recent maintenance tickets
      MaintenanceTicket.findAll({
        include: [
          {
            model: Unit,
            as: 'unit',
            required: true,
            attributes: ['unitNumber'],
            include: [{
              model: Property,
              as: 'property',
              required: true,
              where: { userId },
              attributes: ['name']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    // Process unit stats
    const unitStatusMap: Record<string, number> = {};
    unitStats.forEach((row: any) => {
      unitStatusMap[row.status] = parseInt(row.count, 10);
    });
    const totalUnits = Object.values(unitStatusMap).reduce((a, b) => a + b, 0);
    const occupiedUnits = unitStatusMap['occupied'] || 0;
    const vacantUnits = unitStatusMap['vacant'] || 0;

    // Process tenant stats
    const tenantStatusMap: Record<string, number> = {};
    tenantStats.forEach((row: any) => {
      tenantStatusMap[row.status] = parseInt(row.count, 10);
    });
    const totalTenants = Object.values(tenantStatusMap).reduce((a, b) => a + b, 0);
    const activeTenants = tenantStatusMap['active'] || 0;
    const lateTenants = tenantStatusMap['late'] || 0;

    // Get total revenue
    const totalRevenue = parseFloat((monthlyPaymentsResult as any)?.totalRevenue) || 0;

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProperties,
          totalUnits,
          occupiedUnits,
          vacantUnits,
          occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalTenants,
          activeTenants,
          lateTenants,
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
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

export default router;
