'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entityType: {
      type: DataTypes.ENUM(
        'user',
        'property',
        'unit',
        'tenant',
        'payment',
        'maintenance',
        'document',
        'manager',
        'report',
        'system'
      ),
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 can be up to 45 chars
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'AuditLogs',
    timestamps: true,
    updatedAt: false, // Audit logs should not be updated
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entityType', 'entityId']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  AuditLog.associate = function(models) {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
};
