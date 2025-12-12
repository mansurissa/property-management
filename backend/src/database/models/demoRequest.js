'use strict';

module.exports = (sequelize, DataTypes) => {
  const DemoRequest = sequelize.define('DemoRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    numberOfProperties: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'contacted', 'scheduled', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contactedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contactedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'DemoRequests',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });

  DemoRequest.associate = function(models) {
    DemoRequest.belongsTo(models.User, {
      foreignKey: 'contactedBy',
      as: 'contactedByUser'
    });
  };

  return DemoRequest;
};
