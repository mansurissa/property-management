import { Router, Response } from 'express';
import { authenticate, authorizeAdmin, AuthRequest } from '../middleware/auth.middleware';
import { createUser } from '../services/auth.service';

const db = require('../database/models');
const { User } = db;

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorizeAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authorizeAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Create new user (admin only)
router.post('/', authorizeAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await createUser({
      email,
      password,
      firstName,
      lastName,
      role
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user (admin only)
router.put('/:id', authorizeAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    await user.update({
      email: email || user.email,
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    // Return user without password
    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authorizeAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

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

export default router;
