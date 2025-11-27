import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../utils/jwt.utils';

const db = require('../database/models');
const { User } = db;
const { Op } = require('sequelize');

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    };
  };
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  resetToken?: string; // Only returned in development for testing
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Your account has been deactivated'
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login'
    };
  }
};

export const createUser = async (userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'super_admin' | 'agency' | 'owner' | 'tenant' | 'maintenance';
}): Promise<AuthResponse> => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });

    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'owner'
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    return {
      success: true,
      message: 'User created successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      message: 'An error occurred while creating user'
    };
  }
};

export const forgotPassword = async (email: string): Promise<PasswordResetResponse> => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.'
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token for storage (we'll compare against this)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry to 1 hour from now
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await user.update({
      passwordResetToken: hashedToken,
      passwordResetExpires: resetExpires
    });

    // In production, you would send an email here
    // For now, we'll log the reset URL (only in development)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Password reset URL:', resetUrl);
    }

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Renta - Password Reset Request',
    //   html: `
    //     <p>Hi ${user.firstName || 'there'},</p>
    //     <p>You requested to reset your password. Click the link below to set a new password:</p>
    //     <a href="${resetUrl}">Reset Password</a>
    //     <p>This link will expire in 1 hour.</p>
    //     <p>If you didn't request this, please ignore this email.</p>
    //   `
    // });

    return {
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
      // Only include token in development for testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request'
    };
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<PasswordResetResponse> => {
  try {
    // Hash the provided token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired reset token'
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    return {
      success: true,
      message: 'Password has been reset successfully'
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password'
    };
  }
};
