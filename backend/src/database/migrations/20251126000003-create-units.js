'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Units', {
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
      unitNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      monthlyRent: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      paymentDueDay: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 28
        }
      },
      status: {
        type: Sequelize.ENUM('vacant', 'occupied', 'maintenance'),
        allowNull: false,
        defaultValue: 'vacant'
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

    await queryInterface.addIndex('Units', ['propertyId']);
    await queryInterface.addIndex('Units', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Units');
  }
};
