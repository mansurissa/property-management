'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add agencyId column to Properties table
    await queryInterface.addColumn('Properties', 'agencyId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for faster lookups
    await queryInterface.addIndex('Properties', ['agencyId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Properties', ['agencyId']);
    await queryInterface.removeColumn('Properties', 'agencyId');
  }
};
