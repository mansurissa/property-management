'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nationalId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'agency', 'owner', 'manager', 'tenant', 'maintenance', 'agent'),
      defaultValue: 'owner',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  User.associate = function(models) {
    // Owner associations
    User.hasMany(models.Property, { foreignKey: 'userId', as: 'properties' });
    User.hasMany(models.Tenant, { foreignKey: 'userId', as: 'tenants' });
    User.hasMany(models.Payment, { foreignKey: 'receivedBy', as: 'receivedPayments' });

    // Agency associations - properties managed by this agency
    User.hasMany(models.Property, { foreignKey: 'agencyId', as: 'managedProperties' });

    // Tenant association - links to tenant record when user has tenant role
    User.hasOne(models.Tenant, { foreignKey: 'userAccountId', as: 'tenantProfile' });

    // Maintenance staff association - tickets assigned to this user
    User.hasMany(models.MaintenanceTicket, { foreignKey: 'assignedTo', as: 'assignedTickets' });

    // Manager associations - properties this user manages (as a manager)
    User.hasMany(models.PropertyManager, { foreignKey: 'managerId', as: 'managedPropertyAssignments' });

    // Properties where this owner invited managers
    User.hasMany(models.PropertyManager, { foreignKey: 'invitedBy', as: 'invitedManagers' });
  };

  return User;
};
