import { Router, Response } from 'express';
import { authenticate, authorizeAgent, AuthRequest } from '../middleware/auth.middleware';
import { recordAgentAction, getAgentEarnings, getAgentTransactions, ACTION_TYPES, ACTION_TYPE_LABELS } from '../services/commission.service';
import bcrypt from 'bcryptjs';
const { User, Property, Unit, Tenant, Payment, MaintenanceTicket, AgentCommission, AgentTransaction } = require('../database/models');

const router = Router();

// All routes require authentication and agent role
router.use(authenticate);
router.use(authorizeAgent);

// GET /agent-portal/dashboard - Agent dashboard summary
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.userId!;

    // Get earnings
    const earnings = await getAgentEarnings(agentId);

    // Get recent transactions
    const recentTransactions = await AgentTransaction.findAll({
      where: { agentId },
      order: [['createdAt', 'DESC']],
      limit: 5,
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
      ]
    });

    // Get pending commissions count
    const pendingCommissionsCount = await AgentCommission.count({
      where: { agentId, status: 'pending' }
    });

    return res.status(200).json({
      success: true,
      data: {
        earnings,
        pendingCommissionsCount,
        recentTransactions,
        actionTypes: ACTION_TYPE_LABELS
      }
    });
  } catch (error) {
    console.error('Get agent dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// GET /agent-portal/transactions - Agent activity history
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.userId!;
    const { page = 1, limit = 20 } = req.query;

    const result = await getAgentTransactions(agentId, Number(page), Number(limit));

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// GET /agent-portal/earnings - Agent earnings summary
router.get('/earnings', async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.user?.userId!;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const earnings = await getAgentEarnings(agentId, start, end);

    // Get detailed commission history
    const commissions = await AgentCommission.findAll({
      where: { agentId },
      include: [
        {
          model: AgentTransaction,
          as: 'transaction',
          attributes: ['actionType', 'description', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: earnings,
        commissions
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings'
    });
  }
});

// GET /agent-portal/profile - Get agent profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const earnings = await getAgentEarnings(req.user?.userId!);

    return res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        ...earnings
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// PUT /agent-portal/profile - Update agent profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByPk(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      phone: phone ?? user.phone
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// PUT /agent-portal/change-password - Change password
router.put('/change-password', async (req: AuthRequest, res: Response) => {
  try {
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

    const user = await User.findByPk(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

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

// ============ OWNER ASSISTANCE ROUTES ============

// GET /agent-portal/owners - Search owners
router.get('/owners', async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const whereClause: any = { role: 'owner', isActive: true };

    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const owners = await User.findAll({
      where: whereClause,
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone'],
      limit: 20
    });

    return res.status(200).json({
      success: true,
      data: owners
    });
  } catch (error) {
    console.error('Search owners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search owners'
    });
  }
});

// POST /agent-portal/assist-owner/property - Add property on behalf of owner
router.post('/assist-owner/property', async (req: AuthRequest, res: Response) => {
  try {
    const { ownerId, name, address, city, type } = req.body;

    if (!ownerId || !name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID, name, address, and city are required'
      });
    }

    // Verify owner exists
    const owner = await User.findOne({
      where: { id: ownerId, role: 'owner' }
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    // Create property
    const property = await Property.create({
      userId: ownerId,
      name,
      address,
      city,
      type: type || 'apartment',
      performedByAgentId: req.user?.userId
    });

    // Record agent action
    const result = await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.ADD_PROPERTY,
      targetUserType: 'owner',
      targetUserId: ownerId,
      relatedEntityType: 'Property',
      relatedEntityId: property.id,
      description: `Added property "${name}" for owner ${owner.email}`
    });

    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: {
        property,
        commission: result.commission ? {
          amount: result.commissionAmount,
          status: result.commission.status
        } : null
      }
    });
  } catch (error) {
    console.error('Create property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  }
});

// PUT /agent-portal/assist-owner/property/:propertyId - Update property
router.put('/assist-owner/property/:propertyId', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { name, address, city, type } = req.body;

    const property = await Property.findByPk(propertyId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'email'] }]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await property.update({
      name: name ?? property.name,
      address: address ?? property.address,
      city: city ?? property.city,
      type: type ?? property.type
    });

    // Record agent action
    await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.UPDATE_PROPERTY,
      targetUserType: 'owner',
      targetUserId: property.userId,
      relatedEntityType: 'Property',
      relatedEntityId: property.id,
      description: `Updated property "${property.name}"`
    });

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    console.error('Update property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  }
});

// POST /agent-portal/assist-owner/tenant - Add tenant on behalf of owner
router.post('/assist-owner/tenant', async (req: AuthRequest, res: Response) => {
  try {
    const {
      ownerId,
      unitId,
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      leaseStart,
      leaseEnd,
      rentAmount
    } = req.body;

    if (!ownerId || !unitId || !firstName || !lastName || !email || !leaseStart || !leaseEnd || !rentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify owner and unit
    const unit = await Unit.findByPk(unitId, {
      include: [{ model: Property, as: 'property' }]
    });

    if (!unit || unit.property.userId !== ownerId) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found or does not belong to the specified owner'
      });
    }

    const owner = await User.findByPk(ownerId);

    // Create tenant
    const tenant = await Tenant.create({
      userId: ownerId,
      unitId,
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      leaseStart,
      leaseEnd,
      rentAmount,
      status: 'active',
      performedByAgentId: req.user?.userId
    });

    // Update unit status
    await unit.update({ status: 'occupied' });

    // Record agent action
    const result = await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.ADD_TENANT,
      targetUserType: 'owner',
      targetUserId: ownerId,
      relatedEntityType: 'Tenant',
      relatedEntityId: tenant.id,
      description: `Added tenant ${firstName} ${lastName} for owner ${owner.email}`
    });

    return res.status(201).json({
      success: true,
      message: 'Tenant added successfully',
      data: {
        tenant,
        commission: result.commission ? {
          amount: result.commissionAmount,
          status: result.commission.status
        } : null
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add tenant'
    });
  }
});

// POST /agent-portal/assist-owner/payment - Record payment on behalf of owner
router.post('/assist-owner/payment', async (req: AuthRequest, res: Response) => {
  try {
    const {
      ownerId,
      tenantId,
      unitId,
      amount,
      paymentMethod,
      paymentDate,
      periodMonth,
      periodYear,
      notes
    } = req.body;

    if (!ownerId || !tenantId || !unitId || !amount || !paymentDate || !periodMonth || !periodYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify tenant belongs to owner
    const tenant = await Tenant.findByPk(tenantId, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{ model: Property, as: 'property' }]
      }]
    });

    if (!tenant || tenant.unit.property.userId !== ownerId) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or does not belong to the specified owner'
      });
    }

    const owner = await User.findByPk(ownerId);

    // Create payment
    const payment = await Payment.create({
      tenantId,
      unitId,
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentDate,
      periodMonth,
      periodYear,
      notes,
      receivedBy: req.user?.userId,
      performedByAgentId: req.user?.userId
    });

    // Record agent action with transaction amount
    const result = await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.RECORD_PAYMENT,
      targetUserType: 'owner',
      targetUserId: ownerId,
      relatedEntityType: 'Payment',
      relatedEntityId: payment.id,
      description: `Recorded payment of ${amount} RWF for tenant ${tenant.firstName} ${tenant.lastName}`,
      transactionAmount: parseFloat(amount)
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        commission: result.commission ? {
          amount: result.commissionAmount,
          status: result.commission.status
        } : null
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
});

// ============ TENANT ASSISTANCE ROUTES ============

// GET /agent-portal/tenants - Search tenants
router.get('/tenants', async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const whereClause: any = {};

    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tenants = await Tenant.findAll({
      where: whereClause,
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'status'],
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        }]
      }],
      limit: 20
    });

    return res.status(200).json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Search tenants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search tenants'
    });
  }
});

// PUT /agent-portal/assist-tenant/:tenantId/info - Update tenant contact info
router.put('/assist-tenant/:tenantId/info', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { phone, email } = req.body;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.update({
      phone: phone ?? tenant.phone,
      email: email ?? tenant.email
    });

    // Record agent action
    await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.UPDATE_TENANT,
      targetUserType: 'tenant',
      targetTenantId: tenantId,
      relatedEntityType: 'Tenant',
      relatedEntityId: tenantId,
      description: `Updated contact info for tenant ${tenant.firstName} ${tenant.lastName}`
    });

    return res.status(200).json({
      success: true,
      message: 'Tenant info updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update tenant'
    });
  }
});

// POST /agent-portal/assist-tenant/:tenantId/payment - Record payment on behalf of tenant
router.post('/assist-tenant/:tenantId/payment', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const {
      amount,
      paymentMethod,
      paymentDate,
      periodMonth,
      periodYear,
      notes
    } = req.body;

    if (!amount || !paymentDate || !periodMonth || !periodYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      include: [{
        model: Unit,
        as: 'unit',
        include: [{ model: Property, as: 'property' }]
      }]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Create payment
    const payment = await Payment.create({
      tenantId,
      unitId: tenant.unitId,
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentDate,
      periodMonth,
      periodYear,
      notes,
      receivedBy: req.user?.userId,
      performedByAgentId: req.user?.userId
    });

    // Record agent action
    const result = await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.RECORD_PAYMENT,
      targetUserType: 'tenant',
      targetTenantId: tenantId,
      relatedEntityType: 'Payment',
      relatedEntityId: payment.id,
      description: `Recorded payment of ${amount} RWF for tenant ${tenant.firstName} ${tenant.lastName}`,
      transactionAmount: parseFloat(amount)
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        commission: result.commission ? {
          amount: result.commissionAmount,
          status: result.commission.status
        } : null
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
});

// POST /agent-portal/assist-tenant/:tenantId/maintenance - Submit maintenance request
router.post('/assist-tenant/:tenantId/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { title, description, category, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      include: [{
        model: Unit,
        as: 'unit'
      }]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Create maintenance ticket
    const ticket = await MaintenanceTicket.create({
      unitId: tenant.unitId,
      title,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      reportedBy: tenant.userAccountId,
      performedByAgentId: req.user?.userId
    });

    // Record agent action
    const result = await recordAgentAction({
      agentId: req.user?.userId!,
      actionType: ACTION_TYPES.CREATE_MAINTENANCE,
      targetUserType: 'tenant',
      targetTenantId: tenantId,
      relatedEntityType: 'MaintenanceTicket',
      relatedEntityId: ticket.id,
      description: `Submitted maintenance request "${title}" for tenant ${tenant.firstName} ${tenant.lastName}`
    });

    return res.status(201).json({
      success: true,
      message: 'Maintenance request submitted successfully',
      data: {
        ticket,
        commission: result.commission ? {
          amount: result.commissionAmount,
          status: result.commission.status
        } : null
      }
    });
  } catch (error) {
    console.error('Create maintenance ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit maintenance request'
    });
  }
});

// GET /agent-portal/owner/:ownerId/properties - Get owner's properties
router.get('/owner/:ownerId/properties', async (req: AuthRequest, res: Response) => {
  try {
    const { ownerId } = req.params;

    const properties = await Property.findAll({
      where: { userId: ownerId },
      include: [{
        model: Unit,
        as: 'units',
        attributes: ['id', 'unitNumber', 'status', 'monthlyRent']
      }]
    });

    return res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get owner properties error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
});

// GET /agent-portal/owner/:ownerId/tenants - Get owner's tenants
router.get('/owner/:ownerId/tenants', async (req: AuthRequest, res: Response) => {
  try {
    const { ownerId } = req.params;

    const tenants = await Tenant.findAll({
      where: { userId: ownerId },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unitNumber'],
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        }]
      }]
    });

    return res.status(200).json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Get owner tenants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants'
    });
  }
});

export default router;
