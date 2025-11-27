'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'manager' to the role enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'manager';
    `);

    // Create PropertyManagers table to link managers to properties
    await queryInterface.createTable('PropertyManagers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      managerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          canViewTenants: true,
          canEditTenants: false,
          canViewPayments: true,
          canRecordPayments: false,
          canViewMaintenance: true,
          canManageMaintenance: false,
          canEditProperty: false
        }
      },
      invitedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'revoked'),
        defaultValue: 'active',
        allowNull: false
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

    // Add unique constraint to prevent duplicate manager assignments
    await queryInterface.addIndex('PropertyManagers', ['propertyId', 'managerId'], {
      unique: true,
      name: 'property_manager_unique'
    });

    // Add index for faster lookups
    await queryInterface.addIndex('PropertyManagers', ['managerId'], {
      name: 'property_managers_manager_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PropertyManagers');
    // Note: Cannot remove enum values in PostgreSQL easily
  }
};
