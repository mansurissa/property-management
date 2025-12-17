'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add status column to Documents table
    await queryInterface.addColumn('Documents', 'status', {
      type: Sequelize.ENUM('draft', 'pending_signature', 'signed', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
      after: 'description'
    });

    // Add signedBy column (tenant who signed it)
    await queryInterface.addColumn('Documents', 'signedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'status'
    });

    // Add signedAt timestamp
    await queryInterface.addColumn('Documents', 'signedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'signedBy'
    });

    // Add requestedSignatureAt timestamp
    await queryInterface.addColumn('Documents', 'requestedSignatureAt', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'signedAt'
    });

    // Add signatureMethod (typed, uploaded, physical)
    await queryInterface.addColumn('Documents', 'signatureMethod', {
      type: Sequelize.ENUM('uploaded', 'physical', 'typed', 'none'),
      allowNull: true,
      defaultValue: 'none',
      after: 'requestedSignatureAt'
    });

    // Add notes for rejection or other comments
    await queryInterface.addColumn('Documents', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'signatureMethod'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    await queryInterface.removeColumn('Documents', 'notes');
    await queryInterface.removeColumn('Documents', 'signatureMethod');
    await queryInterface.removeColumn('Documents', 'requestedSignatureAt');
    await queryInterface.removeColumn('Documents', 'signedAt');
    await queryInterface.removeColumn('Documents', 'signedBy');
    await queryInterface.removeColumn('Documents', 'status');
  }
};
