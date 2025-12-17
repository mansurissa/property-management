import { Router, Request, Response } from 'express';
import { login, createUser, forgotPassword, resetPassword } from '../services/auth.service';
import { verifyRefreshToken, generateTokenPair } from '../utils/jwt.utils';
import { authLimiter, passwordResetLimiter } from '../middleware/rate-limit.middleware';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../middleware/validators/auth.validator';
import { validateRequest } from '../middleware/validation.middleware';

const db = require('../database/models');
const { User } = db;

const router = Router();

// Register endpoint
router.post('/register', authLimiter, validateRequest(registerValidation), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Create user (validation already done by middleware)
    const result = await createUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'owner'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, validateRequest(loginValidation), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Attempt login (validation already done by middleware)
    const result = await login({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot Password endpoint
router.post('/forgot-password', passwordResetLimiter, validateRequest(forgotPasswordValidation), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await forgotPassword(email);

    // Always return 200 for security (don't reveal if email exists)
    return res.status(200).json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset Password endpoint
router.post('/reset-password', passwordResetLimiter, validateRequest(resetPasswordValidation), async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const result = await resetPassword(token, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh Token endpoint
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Verify user still exists and is active
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', (_req: Request, res: Response) => {
  // Since we're using JWT, logout is handled on the client side by removing the token
  // In a production app with refresh tokens, you'd also want to invalidate the refresh token
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;
