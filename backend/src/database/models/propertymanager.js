'use strict';

module.exports = (sequelize, DataTypes) => {
  const PropertyManager = sequelize.define('PropertyManager', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Properties',
        key: 'id'
      }
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        canViewTenants: true,
        canEditTenants: false,
        canViewPayments: true,
        canRecordPayments: false,
        canViewMaintenance: true,
        canManageMaintenance: false,
        canEditProperty: false
      }
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'revoked'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'PropertyManagers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['propertyId', 'managerId'],
        name: 'property_manager_unique'
      },
      {
        fields: ['managerId'],
        name: 'property_managers_manager_id'
      }
    ]
  });

  PropertyManager.associate = function(models) {
    // Property this manager is assigned to
    PropertyManager.belongsTo(models.Property, {
      foreignKey: 'propertyId',
      as: 'property'
    });

    // The manager user
    PropertyManager.belongsTo(models.User, {
      foreignKey: 'managerId',
      as: 'manager'
    });

    // The owner who invited this manager
    PropertyManager.belongsTo(models.User, {
      foreignKey: 'invitedBy',
      as: 'inviter'
    });
  };

  return PropertyManager;
};
