'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tenants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      unitId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Units',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nationalId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emergencyContact: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emergencyPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'late', 'exited'),
        allowNull: false,
        defaultValue: 'active'
      },
      leaseStartDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      leaseEndDate: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.addIndex('Tenants', ['unitId']);
    await queryInterface.addIndex('Tenants', ['userId']);
    await queryInterface.addIndex('Tenants', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tenants');
  }
};
