import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

const db = require('../database/models');
const { User, Property, Tenant } = db;

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Get current user's profile
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats based on role
    let stats: any = {};

    if (user.role === 'owner') {
      const propertyCount = await Property.count({ where: { userId } });
      stats.propertiesOwned = propertyCount;
    } else if (user.role === 'manager') {
      // Count properties managed (through PropertyManagers)
      const managedCount = await db.sequelize.query(
        `SELECT COUNT(*) as count FROM "PropertyManagers" WHERE "managerId" = :userId`,
        { replacements: { userId }, type: db.Sequelize.QueryTypes.SELECT }
      );
      stats.propertiesManaged = managedCount[0]?.count || 0;
    } else if (user.role === 'agent') {
      // Get agent transaction counts and earnings
      const transactionCount = await db.AgentTransaction?.count({ where: { agentId: userId } }) || 0;
      const commissions = await db.AgentCommission?.findAll({
        where: { agentId: userId },
        attributes: ['status', 'amount']
      }) || [];

      let totalEarned = 0;
      let totalPending = 0;
      let totalPaid = 0;

      commissions.forEach((c: any) => {
        const amount = parseFloat(c.amount) || 0;
        totalEarned += amount;
        if (c.status === 'pending') totalPending += amount;
        if (c.status === 'paid') totalPaid += amount;
      });

      stats.transactionCount = transactionCount;
      stats.totalEarned = totalEarned;
      stats.totalPending = totalPending;
      stats.totalPaid = totalPaid;
    }

    return res.status(200).json({
      ...user.toJSON(),
      ...stats
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update current user's profile
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone, nationalId } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update object - nationalId only for non-super_admin
    const updateData: any = {
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      phone: phone !== undefined ? phone : user.phone
    };

    // Only allow nationalId update for non-super_admin users
    if (user.role !== 'super_admin' && nationalId !== undefined) {
      updateData.nationalId = nationalId;
    }

    await user.update(updateData);

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.post('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
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

// Delete account
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Don't allow super_admin to delete their own account
    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Super admin accounts cannot be deleted through this method'
      });
    }

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
