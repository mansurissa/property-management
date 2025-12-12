'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add rentDueDay to Tenants table
    await queryInterface.addColumn('Tenants', 'rentDueDay', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1
    });

    // Create Documents table
    await queryInterface.createTable('Documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      entityType: {
        type: Sequelize.ENUM('tenant', 'property', 'unit', 'payment'),
        allowNull: false
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      documentType: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING,
        allowNull: false
      },
      mimeType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      publicId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for Documents
    await queryInterface.addIndex('Documents', ['userId']);
    await queryInterface.addIndex('Documents', ['entityType', 'entityId']);
    await queryInterface.addIndex('Documents', ['documentType']);

    // Create AuditLogs table
    await queryInterface.createTable('AuditLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entityType: {
        type: Sequelize.ENUM(
          'user',
          'property',
          'unit',
          'tenant',
          'payment',
          'maintenance',
          'document',
          'manager',
          'report',
          'system'
        ),
        allowNull: false
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for AuditLogs
    await queryInterface.addIndex('AuditLogs', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['action']);
    await queryInterface.addIndex('AuditLogs', ['entityType', 'entityId']);
    await queryInterface.addIndex('AuditLogs', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    // Remove rentDueDay from Tenants
    await queryInterface.removeColumn('Tenants', 'rentDueDay');

    // Drop Documents table
    await queryInterface.dropTable('Documents');

    // Drop AuditLogs table
    await queryInterface.dropTable('AuditLogs');

    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Documents_entityType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Documents_documentType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AuditLogs_entityType";');
  }
};
