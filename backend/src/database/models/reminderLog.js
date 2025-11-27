'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReminderLog = sequelize.define('ReminderLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('sms', 'email'),
      allowNull: false
    },
    triggerType: {
      type: DataTypes.ENUM('before_due', 'on_due', 'after_due'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('sent', 'failed'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ReminderLogs',
    timestamps: true,
    indexes: [
      {
        fields: ['tenantId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['sentAt']
      }
    ]
  });

  ReminderLog.associate = function(models) {
    ReminderLog.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  };

  return ReminderLog;
};
