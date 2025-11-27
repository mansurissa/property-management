import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { authenticate, authorizeSuperAdmin, AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
const { User, Property, Unit, Tenant, Payment, MaintenanceTicket, sequelize } = require('../database/models');

const router = Router();

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorizeSuperAdmin);

// GET /admin/stats - Get platform-wide statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Get user counts by role
    const userStats = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    const totalUsers = await User.count();
    const totalProperties = await Property.count();
    const totalUnits = await Unit.count();
    const totalTenants = await Tenant.count();

    // Get occupancy stats
    const occupiedUnits = await Unit.count({ where: { status: 'occupied' } });
    const vacantUnits = await Unit.count({ where: { status: 'vacant' } });

    // Get current month's revenue
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyPayments = await Payment.findAll({
      where: {
        periodMonth: currentMonth,
        periodYear: currentYear
      },
      attributes: ['amount']
    });

    const totalRevenue = monthlyPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount),
      0
    );

    // Get pending maintenance
    const pendingMaintenance = await MaintenanceTicket.count({
      where: { status: { [Op.in]: ['pending', 'in_progress'] } }
    });

    // Recent users
    const recentUsers = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProperties,
          totalUnits,
          totalTenants,
          occupiedUnits,
          vacantUnits,
          occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalRevenue,
          pendingMaintenance
        },
        usersByRole: userStats,
        recentUsers,
        currentPeriod: {
          month: currentMonth,
          year: currentYear
        }
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
});

// GET /admin/users - Get all users with pagination
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'isActive', 'createdAt'],
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
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// POST /admin/users - Create a new user
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      });
    }

    const validRoles = ['super_admin', 'agency', 'owner', 'manager', 'tenant', 'maintenance'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// PUT /admin/users/:id - Update a user
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating your own account
    if (id === req.user?.userId && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    await user.update({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      phone: phone ?? user.phone,
      role: role ?? user.role,
      isActive: isActive ?? user.isActive
    });

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// DELETE /admin/users/:id - Delete a user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting your own account
    if (id === req.user?.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// GET /admin/agencies - Get all agencies
router.get('/agencies', async (req: AuthRequest, res: Response) => {
  try {
    const agencies = await User.findAll({
      where: { role: 'agency' },
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'],
      include: [{
        model: Property,
        as: 'managedProperties',
        attributes: ['id', 'name']
      }]
    });

    return res.status(200).json({
      success: true,
      data: agencies
    });
  } catch (error) {
    console.error('Get agencies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agencies'
    });
  }
});

// GET /admin/owners - Get all owners
router.get('/owners', async (req: AuthRequest, res: Response) => {
  try {
    const owners = await User.findAll({
      where: { role: 'owner' },
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'],
      include: [{
        model: Property,
        as: 'properties',
        attributes: ['id', 'name']
      }]
    });

    return res.status(200).json({
      success: true,
      data: owners
    });
  } catch (error) {
    console.error('Get owners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owners'
    });
  }
});

// GET /admin/maintenance-staff - Get all maintenance staff
router.get('/maintenance-staff', async (req: AuthRequest, res: Response) => {
  try {
    const staff = await User.findAll({
      where: { role: 'maintenance' },
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'],
      include: [{
        model: MaintenanceTicket,
        as: 'assignedTickets',
        attributes: ['id', 'category', 'status', 'priority']
      }]
    });

    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get maintenance staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance staff'
    });
  }
});

export default router;
