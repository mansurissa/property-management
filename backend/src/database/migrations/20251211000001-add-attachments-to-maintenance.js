'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MaintenanceTickets', 'attachments', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('MaintenanceTickets', 'attachments');
  }
};
