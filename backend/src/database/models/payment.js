'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Units',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'momo', 'bank'),
      allowNull: false,
      defaultValue: 'cash'
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    periodMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    periodYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receivedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'Payments',
    timestamps: true,
    indexes: [
      {
        fields: ['tenantId']
      },
      {
        fields: ['unitId']
      },
      {
        fields: ['periodMonth', 'periodYear']
      },
      {
        fields: ['paymentDate']
      }
    ]
  });

  Payment.associate = function(models) {
    Payment.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    Payment.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unit' });
    Payment.belongsTo(models.User, { foreignKey: 'receivedBy', as: 'receiver' });
  };

  return Payment;
};
