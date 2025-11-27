import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
const { AgentApplication, User } = require('../database/models');

const router = Router();

// POST /agent-applications - Submit a new agent application (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      nationalId,
      address,
      city,
      motivation,
      experience
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, last name, and phone are required'
      });
    }

    // Check if email already exists as a user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please login instead.'
      });
    }

    // Check if there's already a pending application
    const existingApplication = await AgentApplication.findOne({
      where: { email, status: 'pending' }
    });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending application. Please wait for review.'
      });
    }

    // Create the application
    const application = await AgentApplication.create({
      email,
      firstName,
      lastName,
      phone,
      nationalId,
      address,
      city,
      motivation,
      experience,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully. We will review it and contact you soon.',
      data: {
        id: application.id,
        email: application.email,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    console.error('Agent application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// GET /agent-applications/status/:email - Check application status (public)
router.get('/status/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const application = await AgentApplication.findOne({
      where: { email },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'email', 'firstName', 'lastName', 'status', 'rejectionReason', 'createdAt', 'reviewedAt']
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found with this email'
      });
    }

    return res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Check application status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check application status'
    });
  }
});

export default router;
