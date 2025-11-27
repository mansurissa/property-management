'use strict';

module.exports = (sequelize, DataTypes) => {
  const AgentTransaction = sequelize.define('AgentTransaction', {
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
    actionType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    targetUserType: {
      type: DataTypes.ENUM('owner', 'tenant'),
      allowNull: false
    },
    targetUserId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    targetTenantId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    relatedEntityType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    transactionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    }
  }, {
    tableName: 'AgentTransactions',
    timestamps: true,
    indexes: [
      { fields: ['agentId'] },
      { fields: ['actionType'] },
      { fields: ['createdAt'] }
    ]
  });

  AgentTransaction.associate = function(models) {
    AgentTransaction.belongsTo(models.User, { foreignKey: 'agentId', as: 'agent' });
    AgentTransaction.belongsTo(models.User, { foreignKey: 'targetUserId', as: 'targetUser' });
    AgentTransaction.belongsTo(models.Tenant, { foreignKey: 'targetTenantId', as: 'targetTenant' });
    AgentTransaction.hasOne(models.AgentCommission, { foreignKey: 'transactionId', as: 'commission' });
  };

  return AgentTransaction;
};
