'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
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
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'momo', 'bank'),
        allowNull: false,
        defaultValue: 'cash'
      },
      paymentDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      periodMonth: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12
        }
      },
      periodYear: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      receivedBy: {
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
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Payments', ['tenantId']);
    await queryInterface.addIndex('Payments', ['unitId']);
    await queryInterface.addIndex('Payments', ['periodMonth', 'periodYear']);
    await queryInterface.addIndex('Payments', ['paymentDate']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};
