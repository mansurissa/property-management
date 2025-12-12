'use strict';

module.exports = (sequelize, DataTypes) => {
  const MaintenanceTicket = sequelize.define('MaintenanceTicket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Units',
        key: 'id'
      }
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.ENUM('plumbing', 'electrical', 'structural', 'appliance', 'other'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    }
  }, {
    tableName: 'MaintenanceTickets',
    timestamps: true,
    indexes: [
      {
        fields: ['unitId']
      },
      {
        fields: ['tenantId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      }
    ]
  });

  MaintenanceTicket.associate = function(models) {
    MaintenanceTicket.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unit' });
    MaintenanceTicket.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    MaintenanceTicket.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignee' });
  };

  return MaintenanceTicket;
};
