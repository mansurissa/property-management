import { Router, Response } from 'express';
import { authenticate, authorizeSuperAdmin, AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
const { User, AgentApplication, AgentTransaction, AgentCommission } = require('../database/models');

const router = Router();

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorizeSuperAdmin);

// GET /admin/agents/applications - List all agent applications
router.get('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await AgentApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      data: {
        applications: rows,
        pagination: {
          total: count,
          page: Number(page),
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// GET /admin/agents/applications/:id - Get application details
router.get('/applications/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await AgentApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'isActive']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application'
    });
  }
});

// PUT /admin/agents/applications/:id/approve - Approve an application
router.put('/applications/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await AgentApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This application has already been processed'
      });
    }

    // Check if email already has an account
    const existingUser = await User.findOne({ where: { email: application.email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Generate a random password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the agent user account
    const user = await User.create({
      email: application.email,
      password: hashedPassword,
      firstName: application.firstName,
      lastName: application.lastName,
      phone: application.phone,
      role: 'agent',
      isActive: true
    });

    // Update the application
    await application.update({
      status: 'approved',
      reviewedBy: req.user?.userId,
      reviewedAt: new Date(),
      userId: user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      data: {
        application,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        temporaryPassword: tempPassword // Send this to the agent via email in production
      }
    });
  } catch (error) {
    console.error('Approve application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve application'
    });
  }
});

// PUT /admin/agents/applications/:id/reject - Reject an application
router.put('/applications/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await AgentApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This application has already been processed'
      });
    }

    await application.update({
      status: 'rejected',
      reviewedBy: req.user?.userId,
      reviewedAt: new Date(),
      rejectionReason: reason
    });

    return res.status(200).json({
      success: true,
      message: 'Application rejected',
      data: application
    });
  } catch (error) {
    console.error('Reject application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject application'
    });
  }
});

// GET /admin/agents - List all agents
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { role: 'agent' };

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'suspended') {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    // Get earnings for each agent
    const agentsWithEarnings = await Promise.all(rows.map(async (agent: any) => {
      const commissions = await AgentCommission.findAll({
        where: { agentId: agent.id }
      });

      let totalEarned = 0;
      let pendingEarnings = 0;
      commissions.forEach((c: any) => {
        const amount = parseFloat(c.amount);
        totalEarned += amount;
        if (c.status === 'pending') {
          pendingEarnings += amount;
        }
      });

      const transactionCount = await AgentTransaction.count({
        where: { agentId: agent.id }
      });

      return {
        ...agent.toJSON(),
        totalEarned,
        pendingEarnings,
        transactionCount
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        agents: agentsWithEarnings,
        pagination: {
          total: count,
          page: Number(page),
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get agents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agents'
    });
  }
});

// GET /admin/agents/:id - Get agent details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await User.findOne({
      where: { id, role: 'agent' },
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt']
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get application
    const application = await AgentApplication.findOne({
      where: { userId: id }
    });

    // Get earnings summary
    const commissions = await AgentCommission.findAll({
      where: { agentId: id }
    });

    let totalEarned = 0;
    let pendingEarnings = 0;
    let paidEarnings = 0;
    commissions.forEach((c: any) => {
      const amount = parseFloat(c.amount);
      totalEarned += amount;
      if (c.status === 'pending') {
        pendingEarnings += amount;
      } else if (c.status === 'paid') {
        paidEarnings += amount;
      }
    });

    const transactionCount = await AgentTransaction.count({
      where: { agentId: id }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...agent.toJSON(),
        application,
        earnings: {
          totalEarned,
          pendingEarnings,
          paidEarnings,
          commissionCount: commissions.length
        },
        transactionCount
      }
    });
  } catch (error) {
    console.error('Get agent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agent'
    });
  }
});

// PUT /admin/agents/:id/suspend - Suspend an agent
router.put('/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await User.findOne({
      where: { id, role: 'agent' }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    await agent.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: 'Agent suspended successfully'
    });
  } catch (error) {
    console.error('Suspend agent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to suspend agent'
    });
  }
});

// PUT /admin/agents/:id/activate - Activate an agent
router.put('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await User.findOne({
      where: { id, role: 'agent' }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    await agent.update({ isActive: true });

    return res.status(200).json({
      success: true,
      message: 'Agent activated successfully'
    });
  } catch (error) {
    console.error('Activate agent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate agent'
    });
  }
});

// PUT /admin/agents/:id/reset-password - Reset agent password
router.put('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await User.findOne({
      where: { id, role: 'agent' }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Generate a new random password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await agent.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        temporaryPassword: tempPassword // Send this to the agent via email in production
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// GET /admin/agents/:id/transactions - Get agent activity log
router.get('/:id/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await AgentTransaction.findAndCountAll({
      where: { agentId: id },
      include: [
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: AgentCommission,
          as: 'commission',
          attributes: ['id', 'amount', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      data: {
        transactions: rows,
        pagination: {
          total: count,
          page: Number(page),
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// GET /admin/agents/:id/commissions - Get agent commissions
router.get('/:id/commissions', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { agentId: id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await AgentCommission.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: AgentTransaction,
          as: 'transaction',
          attributes: ['id', 'actionType', 'description', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      data: {
        commissions: rows,
        pagination: {
          total: count,
          page: Number(page),
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions'
    });
  }
});

// PUT /admin/agents/commissions/:commissionId/pay - Mark commission as paid
router.put('/commissions/:commissionId/pay', async (req: AuthRequest, res: Response) => {
  try {
    const { commissionId } = req.params;
    const { notes } = req.body;

    const commission = await AgentCommission.findByPk(commissionId);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (commission.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Commission already paid'
      });
    }

    await commission.update({
      status: 'paid',
      paidAt: new Date(),
      paidBy: req.user?.userId,
      notes
    });

    return res.status(200).json({
      success: true,
      message: 'Commission marked as paid',
      data: commission
    });
  } catch (error) {
    console.error('Pay commission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark commission as paid'
    });
  }
});

export default router;
