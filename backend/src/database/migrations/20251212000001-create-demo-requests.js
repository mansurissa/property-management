'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DemoRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      fullName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      companyName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      numberOfProperties: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'contacted', 'scheduled', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      contactedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      contactedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Add indexes
    await queryInterface.addIndex('DemoRequests', ['email']);
    await queryInterface.addIndex('DemoRequests', ['status']);
    await queryInterface.addIndex('DemoRequests', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DemoRequests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DemoRequests_status";');
  }
};
