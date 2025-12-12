'use strict';

module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('apartment', 'house', 'commercial', 'other'),
      allowNull: false,
      defaultValue: 'apartment'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Kigali'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    agencyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'Properties',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['isDeleted']
      }
    ],
    defaultScope: {
      where: {
        isDeleted: false
      }
    },
    scopes: {
      withDeleted: {
        where: {}
      },
      onlyDeleted: {
        where: {
          isDeleted: true
        }
      }
    }
  });

  Property.associate = function(models) {
    Property.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
    Property.belongsTo(models.User, { foreignKey: 'agencyId', as: 'agency' });
    Property.hasMany(models.Unit, { foreignKey: 'propertyId', as: 'units' });

    // Managers assigned to this property
    Property.hasMany(models.PropertyManager, { foreignKey: 'propertyId', as: 'propertyManagers' });
  };

  return Property;
};
