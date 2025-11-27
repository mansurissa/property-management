'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update the enum type in PostgreSQL
    // We need to add new values to the existing enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'super_admin';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'agency';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'tenant';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'maintenance';
    `);

    // Update existing 'admin' users to 'super_admin'
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET role = 'super_admin' WHERE role = 'admin';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert super_admin back to admin
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET role = 'admin' WHERE role = 'super_admin';
    `);

    // Note: PostgreSQL doesn't allow removing values from ENUMs easily
    // In production, you'd need to recreate the column
  }
};
