const { CommissionRule, AgentTransaction, AgentCommission, User, Tenant } = require('../database/models');

// Action type constants
export const ACTION_TYPES = {
  RECORD_PAYMENT: 'record_payment',
  ADD_TENANT: 'add_tenant',
  ADD_PROPERTY: 'add_property',
  UPDATE_TENANT: 'update_tenant',
  UPDATE_PROPERTY: 'update_property',
  CREATE_MAINTENANCE: 'create_maintenance',
  RESOLVE_MAINTENANCE: 'resolve_maintenance',
  ONBOARD_TENANT: 'onboard_tenant'
};

// Action type labels for display
export const ACTION_TYPE_LABELS: Record<string, string> = {
  [ACTION_TYPES.RECORD_PAYMENT]: 'Record Payment',
  [ACTION_TYPES.ADD_TENANT]: 'Add New Tenant',
  [ACTION_TYPES.ADD_PROPERTY]: 'Add New Property',
  [ACTION_TYPES.UPDATE_TENANT]: 'Update Tenant Info',
  [ACTION_TYPES.UPDATE_PROPERTY]: 'Update Property',
  [ACTION_TYPES.CREATE_MAINTENANCE]: 'Create Maintenance Request',
  [ACTION_TYPES.RESOLVE_MAINTENANCE]: 'Resolve Maintenance Issue',
  [ACTION_TYPES.ONBOARD_TENANT]: 'Onboard Tenant'
};

interface TransactionData {
  agentId: string;
  actionType: string;
  targetUserType: 'owner' | 'tenant';
  targetUserId?: string;
  targetTenantId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  description?: string;
  metadata?: any;
  transactionAmount?: number;
}

interface CommissionResult {
  transaction: any;
  commission: any | null;
  commissionAmount: number;
}

/**
 * Get the commission rule for a specific action type
 */
export async function getCommissionRule(actionType: string): Promise<any | null> {
  const rule = await CommissionRule.findOne({
    where: {
      actionType,
      isActive: true
    }
  });
  return rule;
}

/**
 * Calculate commission amount based on rule and transaction amount
 */
export function calculateCommissionAmount(
  rule: any,
  transactionAmount?: number
): number {
  if (!rule) return 0;

  let commission = 0;

  if (rule.commissionType === 'fixed') {
    commission = parseFloat(rule.commissionValue);
  } else if (rule.commissionType === 'percentage' && transactionAmount) {
    commission = (parseFloat(rule.commissionValue) / 100) * transactionAmount;
  }

  // Apply min/max limits if set
  if (rule.minAmount && commission < parseFloat(rule.minAmount)) {
    commission = parseFloat(rule.minAmount);
  }
  if (rule.maxAmount && commission > parseFloat(rule.maxAmount)) {
    commission = parseFloat(rule.maxAmount);
  }

  return Math.round(commission * 100) / 100; // Round to 2 decimal places
}

/**
 * Record an agent action and calculate commission
 */
export async function recordAgentAction(data: TransactionData): Promise<CommissionResult> {
  // Create the transaction record
  const transaction = await AgentTransaction.create({
    agentId: data.agentId,
    actionType: data.actionType,
    targetUserType: data.targetUserType,
    targetUserId: data.targetUserId,
    targetTenantId: data.targetTenantId,
    relatedEntityType: data.relatedEntityType,
    relatedEntityId: data.relatedEntityId,
    description: data.description,
    metadata: data.metadata,
    transactionAmount: data.transactionAmount
  });

  // Get commission rule for this action
  const rule = await getCommissionRule(data.actionType);

  let commission = null;
  let commissionAmount = 0;

  if (rule) {
    commissionAmount = calculateCommissionAmount(rule, data.transactionAmount);

    if (commissionAmount > 0) {
      commission = await AgentCommission.create({
        agentId: data.agentId,
        transactionId: transaction.id,
        commissionRuleId: rule.id,
        amount: commissionAmount,
        status: 'pending'
      });
    }
  }

  return {
    transaction,
    commission,
    commissionAmount
  };
}

/**
 * Get agent earnings summary
 */
export async function getAgentEarnings(
  agentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  transactionCount: number;
  commissionCount: number;
}> {
  const whereClause: any = { agentId };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt['$gte'] = startDate;
    if (endDate) whereClause.createdAt['$lte'] = endDate;
  }

  const commissions = await AgentCommission.findAll({
    where: whereClause
  });

  const transactionCount = await AgentTransaction.count({
    where: { agentId }
  });

  let totalEarned = 0;
  let totalPending = 0;
  let totalPaid = 0;

  commissions.forEach((c: any) => {
    const amount = parseFloat(c.amount);
    totalEarned += amount;
    if (c.status === 'pending') {
      totalPending += amount;
    } else if (c.status === 'paid') {
      totalPaid += amount;
    }
  });

  return {
    totalEarned,
    totalPending,
    totalPaid,
    transactionCount,
    commissionCount: commissions.length
  };
}

/**
 * Get agent transaction history
 */
export async function getAgentTransactions(
  agentId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ transactions: any[]; total: number; pages: number }> {
  const offset = (page - 1) * limit;

  const { count, rows } = await AgentTransaction.findAndCountAll({
    where: { agentId },
    include: [
      {
        model: User,
        as: 'targetUser',
        attributes: ['id', 'email', 'firstName', 'lastName']
      },
      {
        model: Tenant,
        as: 'targetTenant',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: AgentCommission,
        as: 'commission',
        attributes: ['id', 'amount', 'status']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    transactions: rows,
    total: count,
    pages: Math.ceil(count / limit)
  };
}

/**
 * Mark commission as paid
 */
export async function markCommissionPaid(
  commissionId: string,
  paidBy: string,
  notes?: string
): Promise<any> {
  const commission = await AgentCommission.findByPk(commissionId);

  if (!commission) {
    throw new Error('Commission not found');
  }

  if (commission.status === 'paid') {
    throw new Error('Commission already paid');
  }

  await commission.update({
    status: 'paid',
    paidAt: new Date(),
    paidBy,
    notes
  });

  return commission;
}

/**
 * Get commission reports for admin
 */
export async function getCommissionReports(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCommissions: number;
  totalPending: number;
  totalPaid: number;
  byAgent: any[];
  byActionType: any[];
}> {
  const { Op } = require('sequelize');
  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[Op.gte] = startDate;
    if (endDate) whereClause.createdAt[Op.lte] = endDate;
  }

  const commissions = await AgentCommission.findAll({
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
        attributes: ['actionType']
      }
    ]
  });

  let totalCommissions = 0;
  let totalPending = 0;
  let totalPaid = 0;
  const agentMap: Record<string, { agent: any; total: number; pending: number; paid: number; count: number }> = {};
  const actionTypeMap: Record<string, { total: number; count: number }> = {};

  commissions.forEach((c: any) => {
    const amount = parseFloat(c.amount);
    totalCommissions += amount;

    if (c.status === 'pending') {
      totalPending += amount;
    } else if (c.status === 'paid') {
      totalPaid += amount;
    }

    // Group by agent
    if (!agentMap[c.agentId]) {
      agentMap[c.agentId] = {
        agent: c.agent,
        total: 0,
        pending: 0,
        paid: 0,
        count: 0
      };
    }
    agentMap[c.agentId].total += amount;
    agentMap[c.agentId].count += 1;
    if (c.status === 'pending') {
      agentMap[c.agentId].pending += amount;
    } else if (c.status === 'paid') {
      agentMap[c.agentId].paid += amount;
    }

    // Group by action type
    const actionType = c.transaction?.actionType || 'unknown';
    if (!actionTypeMap[actionType]) {
      actionTypeMap[actionType] = { total: 0, count: 0 };
    }
    actionTypeMap[actionType].total += amount;
    actionTypeMap[actionType].count += 1;
  });

  return {
    totalCommissions,
    totalPending,
    totalPaid,
    byAgent: Object.values(agentMap),
    byActionType: Object.entries(actionTypeMap).map(([actionType, data]) => ({
      actionType,
      label: ACTION_TYPE_LABELS[actionType] || actionType,
      ...data
    }))
  };
}

export default {
  ACTION_TYPES,
  ACTION_TYPE_LABELS,
  getCommissionRule,
  calculateCommissionAmount,
  recordAgentAction,
  getAgentEarnings,
  getAgentTransactions,
  markCommissionPaid,
  getCommissionReports
};
