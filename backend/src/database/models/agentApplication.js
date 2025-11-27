'use strict';

module.exports = (sequelize, DataTypes) => {
  const AgentApplication = sequelize.define('AgentApplication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
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
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nationalId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    motivation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'AgentApplications',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] }
    ]
  });

  AgentApplication.associate = function(models) {
    AgentApplication.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
    AgentApplication.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AgentApplication;
};
