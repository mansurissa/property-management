import { Router, Response } from 'express';
import { authenticate, AuthRequest, authorizeManager } from '../middleware/auth.middleware';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
const { Property, PropertyManager, User, Unit, Tenant, Payment, MaintenanceTicket } = require('../database/models');

const router = Router();

// All routes require authentication and manager role
router.use(authenticate);
router.use(authorizeManager);

// Middleware to check if manager has access to a property
const checkPropertyAccess = async (req: AuthRequest, res: Response, next: any) => {
  const { propertyId } = req.params;

  const assignment = await PropertyManager.findOne({
    where: {
      propertyId,
      managerId: req.user?.userId,
      status: 'active'
    }
  });

  if (!assignment) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this property'
    });
  }

  // Attach permissions to request for use in route handlers
  (req as any).managerPermissions = assignment.permissions;
  (req as any).propertyAssignment = assignment;

  next();
};

// GET /manager-portal/properties - List all properties the manager has access to
router.get('/properties', async (req: AuthRequest, res: Response) => {
  try {
    const assignments = await PropertyManager.findAll({
      where: {
        managerId: req.user?.userId,
        status: 'active'
      },
      include: [
        {
          model: Property,
          as: 'property',
          include: [
            {
              model: Unit,
              as: 'units',
              attributes: ['id', 'unitNumber', 'status', 'monthlyRent']
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const properties = assignments.map((a: any) => ({
      ...a.property.toJSON(),
      permissions: a.permissions,
      assignedAt: a.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get managed properties error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
});

// GET /manager-portal/properties/:propertyId - Get property details
router.get('/properties/:propertyId', checkPropertyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findByPk(propertyId, {
      include: [
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unitNumber', 'floor', 'bedrooms', 'bathrooms', 'monthlyRent', 'status', 'paymentDueDay']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: {
        ...property.toJSON(),
        permissions: (req as any).managerPermissions
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
});

// GET /manager-portal/properties/:propertyId/tenants - List tenants (if permitted)
router.get('/properties/:propertyId/tenants', checkPropertyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const permissions = (req as any).managerPermissions;

    if (!permissions.canViewTenants) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view tenants'
      });
    }

    // Get all units for this property
    const units = await Unit.findAll({
      where: { propertyId },
      attributes: ['id']
    });

    const unitIds = units.map((u: any) => u.id);

    const tenants = await Tenant.findAll({
      where: { unitId: unitIds },
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber', 'monthlyRent']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants'
    });
  }
});

// GET /manager-portal/properties/:propertyId/payments - List payments (if permitted)
router.get('/properties/:propertyId/payments', checkPropertyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const permissions = (req as any).managerPermissions;

    if (!permissions.canViewPayments) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view payments'
      });
    }

    // Get all units for this property
    const units = await Unit.findAll({
      where: { propertyId },
      attributes: ['id']
    });

    const unitIds = units.map((u: any) => u.id);

    // Get tenants for these units
    const tenants = await Tenant.findAll({
      where: { unitId: unitIds },
      attributes: ['id']
    });

    const tenantIds = tenants.map((t: any) => t.id);

    const payments = await Payment.findAll({
      where: { tenantId: tenantIds },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName'],
          include: [
            {
              model: Unit,
              as: 'unit',
              attributes: ['id', 'unitNumber']
            }
          ]
        }
      ],
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

// GET /manager-portal/properties/:propertyId/maintenance - List maintenance tickets (if permitted)
router.get('/properties/:propertyId/maintenance', checkPropertyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const permissions = (req as any).managerPermissions;

    if (!permissions.canViewMaintenance) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view maintenance tickets'
      });
    }

    // Get all units for this property
    const units = await Unit.findAll({
      where: { propertyId },
      attributes: ['id']
    });

    const unitIds = units.map((u: any) => u.id);

    const tickets = await MaintenanceTicket.findAll({
      where: { unitId: unitIds },
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber']
        },
        {
          model: User,
          as: 'assignedStaff',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
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

// GET /manager-portal/dashboard - Dashboard summary for manager
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const assignments = await PropertyManager.findAll({
      where: {
        managerId: req.user?.userId,
        status: 'active'
      },
      include: [
        {
          model: Property,
          as: 'property'
        }
      ]
    });

    const propertyIds = assignments.map((a: any) => a.propertyId);

    // Get all units for managed properties
    const units = await Unit.findAll({
      where: { propertyId: propertyIds }
    });

    const unitIds = units.map((u: any) => u.id);

    // Get tenant count
    const tenantCount = await Tenant.count({
      where: {
        unitId: unitIds,
        status: 'active'
      }
    });

    // Get open maintenance tickets count
    const openTicketsCount = await MaintenanceTicket.count({
      where: {
        unitId: unitIds,
        status: { [Op.in]: ['open', 'in_progress'] }
      }
    });

    // Get this month's payments
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const tenants = await Tenant.findAll({
      where: { unitId: unitIds },
      attributes: ['id']
    });
    const tenantIds = tenants.map((t: any) => t.id);

    const paymentsThisMonth = await Payment.findAll({
      where: {
        tenantId: tenantIds,
        paymentDate: { [Op.gte]: startOfMonth }
      }
    });

    const totalCollected = paymentsThisMonth.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

    return res.status(200).json({
      success: true,
      data: {
        propertiesManaged: propertyIds.length,
        totalUnits: units.length,
        occupiedUnits: units.filter((u: any) => u.status === 'occupied').length,
        vacantUnits: units.filter((u: any) => u.status === 'vacant').length,
        tenantCount,
        openMaintenanceTickets: openTicketsCount,
        paymentsThisMonth: {
          count: paymentsThisMonth.length,
          totalAmount: totalCollected
        }
      }
    });
  } catch (error) {
    console.error('Get manager dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// GET /manager-portal/profile - Get manager's profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get number of properties managed
    const assignmentCount = await PropertyManager.count({
      where: {
        managerId: req.user?.userId,
        status: 'active'
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        propertiesManaged: assignmentCount
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

// PUT /manager-portal/profile - Update manager's profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByPk(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      phone: phone ?? user.phone
    });

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// PUT /manager-portal/change-password - Change password
router.put('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findByPk(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// DELETE /manager-portal/account - Delete manager's own account
router.delete('/account', async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to confirm account deletion'
      });
    }

    const user = await User.findByPk(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password before deletion
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Delete all property manager assignments first
    await PropertyManager.destroy({
      where: { managerId: req.user?.userId }
    });

    // Delete the user account
    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

export default router;
