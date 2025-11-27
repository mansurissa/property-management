import { Router, Request, Response } from 'express';
import { login, createUser, forgotPassword, resetPassword } from '../services/auth.service';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, name, email, password, phone, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Handle name - either use firstName/lastName directly or split from name
    let userFirstName = firstName;
    let userLastName = lastName;

    if (!firstName && name) {
      const nameParts = name.trim().split(' ');
      userFirstName = nameParts[0] || '';
      userLastName = nameParts.slice(1).join(' ') || '';
    }

    // Create user
    const result = await createUser({
      email,
      password,
      firstName: userFirstName,
      lastName: userLastName,
      phone,
      role: role || 'landlord'
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
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Attempt login
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
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

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
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

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

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  // Since we're using JWT, logout is handled on the client side by removing the token
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;
