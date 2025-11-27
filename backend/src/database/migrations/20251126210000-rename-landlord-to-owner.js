'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'owner' to the enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'owner';
    `);

    // Update existing 'landlord' users to 'owner'
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET role = 'owner' WHERE role = 'landlord';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert owner back to landlord
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET role = 'landlord' WHERE role = 'owner';
    `);

    // Note: PostgreSQL doesn't allow removing values from ENUMs easily
  }
};
