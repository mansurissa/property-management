'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add userAccountId column to Tenants table
    // This links a tenant record to a User account for login capability
    await queryInterface.addColumn('Tenants', 'userAccountId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add unique index - each user can only be linked to one tenant
    await queryInterface.addIndex('Tenants', ['userAccountId'], {
      unique: true,
      name: 'tenants_user_account_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Tenants', 'tenants_user_account_unique');
    await queryInterface.removeColumn('Tenants', 'userAccountId');
  }
};
