'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MaintenanceTickets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      unitId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Units',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      category: {
        type: Sequelize.ENUM('plumbing', 'electrical', 'structural', 'appliance', 'other'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('MaintenanceTickets', ['unitId']);
    await queryInterface.addIndex('MaintenanceTickets', ['tenantId']);
    await queryInterface.addIndex('MaintenanceTickets', ['status']);
    await queryInterface.addIndex('MaintenanceTickets', ['priority']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MaintenanceTickets');
  }
};
