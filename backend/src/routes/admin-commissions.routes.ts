import { Router, Response } from 'express';
import { authenticate, authorizeSuperAdmin, AuthRequest } from '../middleware/auth.middleware';
import { ACTION_TYPE_LABELS, getCommissionReports } from '../services/commission.service';
import { Op } from 'sequelize';
const { CommissionRule, AgentCommission, AgentTransaction, User } = require('../database/models');

const router = Router();

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorizeSuperAdmin);

// GET /admin/commissions/rules - List all commission rules
router.get('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const rules = await CommissionRule.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['actionType', 'ASC']]
    });

    // Add labels to each rule
    const rulesWithLabels = rules.map((rule: any) => ({
      ...rule.toJSON(),
      actionTypeLabel: ACTION_TYPE_LABELS[rule.actionType] || rule.actionType
    }));

    return res.status(200).json({
      success: true,
      data: rulesWithLabels
    });
  } catch (error) {
    console.error('Get commission rules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch commission rules'
    });
  }
});

// GET /admin/commissions/rules/:id - Get commission rule details
router.get('/rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const rule = await CommissionRule.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Commission rule not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...rule.toJSON(),
        actionTypeLabel: ACTION_TYPE_LABELS[rule.actionType] || rule.actionType
      }
    });
  } catch (error) {
    console.error('Get commission rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch commission rule'
    });
  }
});

// POST /admin/commissions/rules - Create a new commission rule
router.post('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const {
      actionType,
      name,
      description,
      commissionType,
      commissionValue,
      minAmount,
      maxAmount,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!actionType || !name || !commissionType || commissionValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Action type, name, commission type, and commission value are required'
      });
    }

    // Check if rule already exists for this action type
    const existingRule = await CommissionRule.findOne({
      where: { actionType }
    });

    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: 'A commission rule already exists for this action type'
      });
    }

    const rule = await CommissionRule.create({
      actionType,
      name,
      description,
      commissionType,
      commissionValue,
      minAmount,
      maxAmount,
      isActive,
      createdBy: req.user?.userId
    });

    return res.status(201).json({
      success: true,
      message: 'Commission rule created successfully',
      data: rule
    });
  } catch (error) {
    console.error('Create commission rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create commission rule'
    });
  }
});

// PUT /admin/commissions/rules/:id - Update a commission rule
router.put('/rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      commissionType,
      commissionValue,
      minAmount,
      maxAmount,
      isActive
    } = req.body;

    const rule = await CommissionRule.findByPk(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Commission rule not found'
      });
    }

    await rule.update({
      name: name ?? rule.name,
      description: description ?? rule.description,
      commissionType: commissionType ?? rule.commissionType,
      commissionValue: commissionValue ?? rule.commissionValue,
      minAmount: minAmount !== undefined ? minAmount : rule.minAmount,
      maxAmount: maxAmount !== undefined ? maxAmount : rule.maxAmount,
      isActive: isActive !== undefined ? isActive : rule.isActive
    });

    return res.status(200).json({
      success: true,
      message: 'Commission rule updated successfully',
      data: rule
    });
  } catch (error) {
    console.error('Update commission rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update commission rule'
    });
  }
});

// DELETE /admin/commissions/rules/:id - Delete a commission rule
router.delete('/rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const rule = await CommissionRule.findByPk(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Commission rule not found'
      });
    }

    // Check if there are any commissions using this rule
    const commissionsCount = await AgentCommission.count({
      where: { commissionRuleId: id }
    });

    if (commissionsCount > 0) {
      // Instead of deleting, just deactivate
      await rule.update({ isActive: false });
      return res.status(200).json({
        success: true,
        message: 'Commission rule has been deactivated (has associated commissions)'
      });
    }

    await rule.destroy();

    return res.status(200).json({
      success: true,
      message: 'Commission rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete commission rule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete commission rule'
    });
  }
});

// GET /admin/commissions/action-types - List available action types
router.get('/action-types', async (req: AuthRequest, res: Response) => {
  try {
    const actionTypes = Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => ({
      value: key,
      label
    }));

    return res.status(200).json({
      success: true,
      data: actionTypes
    });
  } catch (error) {
    console.error('Get action types error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch action types'
    });
  }
});

// GET /admin/commissions/reports - Get commission reports
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const reports = await getCommissionReports(start, end);

    return res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get commission reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch commission reports'
    });
  }
});

// GET /admin/commissions - List all commissions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, agentId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (agentId) {
      whereClause.agentId = agentId;
    }

    const { count, rows } = await AgentCommission.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: AgentTransaction,
          as: 'transaction',
          attributes: ['id', 'actionType', 'description', 'createdAt']
        },
        {
          model: CommissionRule,
          as: 'rule',
          attributes: ['id', 'name', 'actionType']
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

// PUT /admin/commissions/:id/pay - Mark commission as paid
router.put('/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const commission = await AgentCommission.findByPk(id);

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

// POST /admin/commissions/pay-bulk - Pay multiple commissions
router.post('/pay-bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { commissionIds, notes } = req.body;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission IDs are required'
      });
    }

    const result = await AgentCommission.update(
      {
        status: 'paid',
        paidAt: new Date(),
        paidBy: req.user?.userId,
        notes
      },
      {
        where: {
          id: { [Op.in]: commissionIds },
          status: 'pending'
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: `${result[0]} commission(s) marked as paid`
    });
  } catch (error) {
    console.error('Bulk pay commissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to pay commissions'
    });
  }
});

export default router;
