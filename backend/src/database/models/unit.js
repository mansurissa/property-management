'use strict';

module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
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
    unitNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    monthlyRent: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentDueDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 28
      }
    },
    status: {
      type: DataTypes.ENUM('vacant', 'occupied', 'maintenance'),
      allowNull: false,
      defaultValue: 'vacant'
    }
  }, {
    tableName: 'Units',
    timestamps: true,
    indexes: [
      {
        fields: ['propertyId']
      },
      {
        fields: ['status']
      }
    ]
  });

  Unit.associate = function(models) {
    Unit.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
    Unit.hasOne(models.Tenant, { foreignKey: 'unitId', as: 'tenant' });
    Unit.hasMany(models.Payment, { foreignKey: 'unitId', as: 'payments' });
    Unit.hasMany(models.MaintenanceTicket, { foreignKey: 'unitId', as: 'maintenanceTickets' });
  };

  return Unit;
};
