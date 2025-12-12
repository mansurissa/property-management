'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
    type: {
      type: DataTypes.ENUM(
        'payment_reminder',
        'payment_received',
        'payment_overdue',
        'lease_expiry',
        'maintenance_update',
        'maintenance_new',
        'tenant_added',
        'tenant_removed',
        'property_update',
        'system',
        'announcement',
        'message'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    entityType: {
      type: DataTypes.ENUM(
        'payment',
        'tenant',
        'property',
        'unit',
        'maintenance',
        'lease',
        'system'
      ),
      allowNull: true
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['userId', 'isRead']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['entityType', 'entityId']
      }
    ],
    scopes: {
      unread: {
        where: { isRead: false }
      },
      read: {
        where: { isRead: true }
      }
    }
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};
