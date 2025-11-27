'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add assignedTo column to MaintenanceTickets table
    // This links a ticket to a maintenance staff user
    await queryInterface.addColumn('MaintenanceTickets', 'assignedTo', {
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
    await queryInterface.addIndex('MaintenanceTickets', ['assignedTo']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('MaintenanceTickets', ['assignedTo']);
    await queryInterface.removeColumn('MaintenanceTickets', 'assignedTo');
  }
};
