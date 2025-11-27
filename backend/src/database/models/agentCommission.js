'use strict';

module.exports = (sequelize, DataTypes) => {
  const AgentCommission = sequelize.define('AgentCommission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    commissionRuleId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'AgentCommissions',
    timestamps: true,
    indexes: [
      { fields: ['agentId'] },
      { fields: ['status'] }
    ]
  });

  AgentCommission.associate = function(models) {
    AgentCommission.belongsTo(models.User, { foreignKey: 'agentId', as: 'agent' });
    AgentCommission.belongsTo(models.AgentTransaction, { foreignKey: 'transactionId', as: 'transaction' });
    AgentCommission.belongsTo(models.CommissionRule, { foreignKey: 'commissionRuleId', as: 'rule' });
    AgentCommission.belongsTo(models.User, { foreignKey: 'paidBy', as: 'payer' });
  };

  return AgentCommission;
};
