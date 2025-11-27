import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { Property, Unit, Tenant, Payment, MaintenanceTicket, sequelize } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /dashboard/stats - Get dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get total properties
    const totalProperties = await Property.count({
      where: { userId }
    });

    // Get total units and their status breakdown
    const properties = await Property.findAll({
      where: { userId },
      attributes: ['id']
    });
    const propertyIds = properties.map((p: any) => p.id);

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

    // Get total tenants
    const totalTenants = await Tenant.count({
      where: { userId }
    });

    const activeTenants = await Tenant.count({
      where: { userId, status: 'active' }
    });

    const lateTenants = await Tenant.count({
      where: { userId, status: 'late' }
    });

    // Get current month's payments
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyPayments = await Payment.findAll({
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
      attributes: ['amount']
    });

    const totalRevenue = monthlyPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount),
      0
    );

    // Get pending maintenance tickets
    const pendingMaintenance = await MaintenanceTicket.count({
      include: [{
        model: Unit,
        as: 'unit',
        include: [{
          model: Property,
          as: 'property',
          where: { userId }
        }]
      }],
      where: {
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
    });

    // Get recent maintenance tickets
    const recentMaintenance = await MaintenanceTicket.findAll({
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
