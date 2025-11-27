'use strict';

module.exports = (sequelize, DataTypes) => {
  const CommissionRule = sequelize.define('CommissionRule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    actionType: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    commissionType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false
    },
    commissionValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    minAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    maxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'CommissionRules',
    timestamps: true,
    indexes: [
      { fields: ['actionType'] },
      { fields: ['isActive'] }
    ]
  });

  CommissionRule.associate = function(models) {
    CommissionRule.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    CommissionRule.hasMany(models.AgentCommission, { foreignKey: 'commissionRuleId', as: 'commissions' });
  };

  // Action types constants
  CommissionRule.ACTION_TYPES = {
    RECORD_PAYMENT: 'record_payment',
    ADD_TENANT: 'add_tenant',
    ADD_PROPERTY: 'add_property',
    UPDATE_TENANT: 'update_tenant',
    UPDATE_PROPERTY: 'update_property',
    CREATE_MAINTENANCE: 'create_maintenance',
    RESOLVE_MAINTENANCE: 'resolve_maintenance',
    ONBOARD_TENANT: 'onboard_tenant'
  };

  return CommissionRule;
};
