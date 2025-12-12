'use strict';

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
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
    entityType: {
      type: DataTypes.ENUM('tenant', 'property', 'unit', 'payment'),
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    documentType: {
      type: DataTypes.ENUM(
        'lease_agreement',
        'id_copy',
        'proof_of_income',
        'reference_letter',
        'property_deed',
        'insurance',
        'inspection_report',
        'receipt',
        'other'
      ),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Documents',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['entityType', 'entityId']
      },
      {
        fields: ['documentType']
      }
    ]
  });

  Document.associate = function(models) {
    Document.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });

    // Virtual associations based on entityType
    Document.belongsTo(models.Tenant, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'tenant'
    });
    Document.belongsTo(models.Property, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'property'
    });
    Document.belongsTo(models.Unit, {
      foreignKey: 'entityId',
      constraints: false,
      as: 'unit'
    });
  };

  return Document;
};
