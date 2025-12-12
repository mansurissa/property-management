import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { sendEmail } from '../services/email.service';
import { createNotification, createBulkNotifications } from '../services/notification.service';

const { DemoRequest, User } = require('../database/models');
const { Op } = require('sequelize');

const router = Router();

// Validation for demo request
const demoRequestValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('companyName').optional().trim(),
  body('numberOfProperties').optional().trim(),
  body('message').optional().trim()
];

// Public route - Submit demo request
router.post('/', demoRequestValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, email, phone, companyName, numberOfProperties, message } = req.body;

    // Create demo request
    const demoRequest = await DemoRequest.create({
      fullName,
      email,
      phone,
      companyName,
      numberOfProperties,
      message,
      status: 'pending'
    });

    // Send confirmation email to the requester
    await sendDemoRequestConfirmationEmail(email, fullName);

    // Notify all super admins
    const superAdmins = await User.findAll({
      where: { role: 'super_admin', isActive: true }
    });

    if (superAdmins.length > 0) {
      // Send email to admins
      for (const admin of superAdmins) {
        await sendNewDemoRequestNotificationEmail(
          admin.email,
          admin.firstName,
          { fullName, email, phone, companyName, numberOfProperties, message }
        );
      }

      // Create in-app notifications for admins
      await createBulkNotifications(
        superAdmins.map((admin: any) => admin.id),
        {
          type: 'system',
          title: 'New Demo Request',
          message: `${fullName} has requested a demo. Email: ${email}`,
          priority: 'high',
          actionUrl: '/dashboard/admin/demo-requests'
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Demo request submitted successfully. We will contact you soon!'
    });
  } catch (error) {
    console.error('Demo request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit demo request'
    });
  }
});

// Admin routes - Get all demo requests
router.get(
  '/admin',
  authenticate,
  authorizeRoles('super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: demoRequests } = await DemoRequest.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'contactedByUser',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        success: true,
        data: demoRequests,
        meta: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get demo requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch demo requests'
      });
    }
  }
);

// Admin route - Get demo request stats
router.get(
  '/admin/stats',
  authenticate,
  authorizeRoles('super_admin'),
  async (req: Request, res: Response) => {
    try {
      const [pending, contacted, scheduled, completed, cancelled, total] = await Promise.all([
        DemoRequest.count({ where: { status: 'pending' } }),
        DemoRequest.count({ where: { status: 'contacted' } }),
        DemoRequest.count({ where: { status: 'scheduled' } }),
        DemoRequest.count({ where: { status: 'completed' } }),
        DemoRequest.count({ where: { status: 'cancelled' } }),
        DemoRequest.count()
      ]);

      // Get recent requests (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCount = await DemoRequest.count({
        where: {
          createdAt: { [Op.gte]: sevenDaysAgo }
        }
      });

      res.json({
        success: true,
        data: {
          pending,
          contacted,
          scheduled,
          completed,
          cancelled,
          total,
          recentCount
        }
      });
    } catch (error) {
      console.error('Get demo stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch demo request stats'
      });
    }
  }
);

// Admin route - Update demo request status
router.put(
  '/admin/:id',
  authenticate,
  authorizeRoles('super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes, scheduledAt } = req.body;
      const userId = (req as any).user.id;

      const demoRequest = await DemoRequest.findByPk(id);
      if (!demoRequest) {
        return res.status(404).json({
          success: false,
          message: 'Demo request not found'
        });
      }

      const updateData: any = {};
      if (status) {
        updateData.status = status;
        if (status === 'contacted' && !demoRequest.contactedAt) {
          updateData.contactedAt = new Date();
          updateData.contactedBy = userId;
        }
      }
      if (notes !== undefined) updateData.notes = notes;
      if (scheduledAt) updateData.scheduledAt = scheduledAt;

      await demoRequest.update(updateData);

      // Reload with association
      await demoRequest.reload({
        include: [
          {
            model: User,
            as: 'contactedByUser',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Demo request updated successfully',
        data: demoRequest
      });
    } catch (error) {
      console.error('Update demo request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update demo request'
      });
    }
  }
);

// Admin route - Delete demo request
router.delete(
  '/admin/:id',
  authenticate,
  authorizeRoles('super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await DemoRequest.destroy({ where: { id } });
      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: 'Demo request not found'
        });
      }

      res.json({
        success: true,
        message: 'Demo request deleted successfully'
      });
    } catch (error) {
      console.error('Delete demo request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete demo request'
      });
    }
  }
);

// Email helper functions
async function sendDemoRequestConfirmationEmail(email: string, fullName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Renta</h1>
        </div>
        <div class="content">
          <h2>Thank You for Your Interest!</h2>
          <p>Hi ${fullName},</p>
          <p>Thank you for requesting a demo of Renta. We're excited to show you how our platform can help simplify your property management.</p>
          <p>One of our team members will contact you within 24-48 hours to schedule a personalized demo at your convenience.</p>
          <p>In the meantime, feel free to explore our website to learn more about our features.</p>
          <p>Best regards,<br>The Renta Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
          <p>Property Management Made Simple</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Renta - Demo Request Received',
    html
  });
}

async function sendNewDemoRequestNotificationEmail(
  adminEmail: string,
  adminName: string | null,
  request: {
    fullName: string;
    email: string;
    phone: string;
    companyName?: string;
    numberOfProperties?: string;
    message?: string;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .details { background-color: #EEF2FF; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .details p { margin: 5px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Demo Request</h1>
        </div>
        <div class="content">
          <p>Hi ${adminName || 'Admin'},</p>
          <p>A new demo request has been submitted. Here are the details:</p>
          <div class="details">
            <p><strong>Name:</strong> ${request.fullName}</p>
            <p><strong>Email:</strong> ${request.email}</p>
            <p><strong>Phone:</strong> ${request.phone}</p>
            ${request.companyName ? `<p><strong>Company:</strong> ${request.companyName}</p>` : ''}
            ${request.numberOfProperties ? `<p><strong>Number of Properties:</strong> ${request.numberOfProperties}</p>` : ''}
            ${request.message ? `<p><strong>Message:</strong> ${request.message}</p>` : ''}
          </div>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/admin/demo-requests" class="button">View Demo Requests</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Renta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Renta - New Demo Request from ${request.fullName}`,
    html
  });
}

export default router;
