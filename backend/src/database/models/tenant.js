'use strict';

module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Units',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nationalId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'late', 'exited'),
      allowNull: false,
      defaultValue: 'active'
    },
    leaseStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    leaseEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    rentDueDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 28
      }
    },
    userAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'Tenants',
    timestamps: true,
    indexes: [
      {
        fields: ['unitId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      }
    ]
  });

  Tenant.associate = function(models) {
    Tenant.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unit' });
    Tenant.belongsTo(models.User, { foreignKey: 'userId', as: 'landlord' });
    Tenant.belongsTo(models.User, { foreignKey: 'userAccountId', as: 'userAccount' });
    Tenant.hasMany(models.Payment, { foreignKey: 'tenantId', as: 'payments' });
    Tenant.hasMany(models.MaintenanceTicket, { foreignKey: 'tenantId', as: 'maintenanceTickets' });
    Tenant.hasMany(models.ReminderLog, { foreignKey: 'tenantId', as: 'reminderLogs' });
  };

  return Tenant;
};
