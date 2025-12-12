'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Notifications table
    await queryInterface.createTable('Notifications', {
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
      type: {
        type: Sequelize.ENUM(
          'payment_reminder',
          'payment_received',
          'payment_overdue',
          'lease_expiry',
          'maintenance_update',
          'maintenance_new',
          'tenant_added',
          'tenant_removed',
          'property_update',
          'system',
          'announcement',
          'message'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      entityType: {
        type: Sequelize.ENUM(
          'payment',
          'tenant',
          'property',
          'unit',
          'maintenance',
          'lease',
          'system'
        ),
        allowNull: true
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      actionUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      expiresAt: {
        type: Sequelize.DATE,
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

    // Add indexes for Notifications
    await queryInterface.addIndex('Notifications', ['userId']);
    await queryInterface.addIndex('Notifications', ['userId', 'isRead']);
    await queryInterface.addIndex('Notifications', ['type']);
    await queryInterface.addIndex('Notifications', ['createdAt']);
    await queryInterface.addIndex('Notifications', ['entityType', 'entityId']);

    // Add soft delete fields to Properties table
    await queryInterface.addColumn('Properties', 'isDeleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Properties', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Properties', 'deletedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for soft deleted properties
    await queryInterface.addIndex('Properties', ['isDeleted']);
  },

  async down(queryInterface, Sequelize) {
    // Remove soft delete fields from Properties
    await queryInterface.removeColumn('Properties', 'isDeleted');
    await queryInterface.removeColumn('Properties', 'deletedAt');
    await queryInterface.removeColumn('Properties', 'deletedBy');

    // Drop Notifications table
    await queryInterface.dropTable('Notifications');

    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_entityType";');
  }
};
