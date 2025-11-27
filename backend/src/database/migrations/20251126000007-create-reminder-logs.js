'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReminderLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('sms', 'email'),
        allowNull: false
      },
      triggerType: {
        type: Sequelize.ENUM('before_due', 'on_due', 'after_due'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('sent', 'failed'),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sentAt: {
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

    await queryInterface.addIndex('ReminderLogs', ['tenantId']);
    await queryInterface.addIndex('ReminderLogs', ['type']);
    await queryInterface.addIndex('ReminderLogs', ['sentAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ReminderLogs');
  }
};
