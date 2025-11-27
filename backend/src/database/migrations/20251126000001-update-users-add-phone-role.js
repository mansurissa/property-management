'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add phone column to Users
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Update role enum to include 'landlord'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'landlord';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'phone');
    // Note: PostgreSQL doesn't support removing enum values easily
  }
};
