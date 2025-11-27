'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'agent' to the role ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'agent';
    `);

    // 2. Create AgentApplications table
    await queryInterface.createTable('AgentApplications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nationalId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      motivation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      experience: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      reviewedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userId: {
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. Create CommissionRules table
    await queryInterface.createTable('CommissionRules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      actionType: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      commissionType: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false
      },
      commissionValue: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      minAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      maxAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdBy: {
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Create AgentTransactions table
    await queryInterface.createTable('AgentTransactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      agentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actionType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      targetUserType: {
        type: Sequelize.ENUM('owner', 'tenant'),
        allowNull: false
      },
      targetUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      targetTenantId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      relatedEntityType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      relatedEntityId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      transactionAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Create AgentCommissions table
    await queryInterface.createTable('AgentCommissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      agentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      transactionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'AgentTransactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      commissionRuleId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'CommissionRules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      paidBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 6. Add performedByAgentId to Payments table
    await queryInterface.addColumn('Payments', 'performedByAgentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 7. Add performedByAgentId to Properties table
    await queryInterface.addColumn('Properties', 'performedByAgentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 8. Add performedByAgentId to Tenants table
    await queryInterface.addColumn('Tenants', 'performedByAgentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 9. Add performedByAgentId to MaintenanceTickets table
    await queryInterface.addColumn('MaintenanceTickets', 'performedByAgentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Create indexes
    await queryInterface.addIndex('AgentApplications', ['email']);
    await queryInterface.addIndex('AgentApplications', ['status']);
    await queryInterface.addIndex('AgentTransactions', ['agentId']);
    await queryInterface.addIndex('AgentTransactions', ['actionType']);
    await queryInterface.addIndex('AgentTransactions', ['createdAt']);
    await queryInterface.addIndex('AgentCommissions', ['agentId']);
    await queryInterface.addIndex('AgentCommissions', ['status']);
    await queryInterface.addIndex('CommissionRules', ['actionType']);
    await queryInterface.addIndex('CommissionRules', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from existing tables
    await queryInterface.removeColumn('MaintenanceTickets', 'performedByAgentId');
    await queryInterface.removeColumn('Tenants', 'performedByAgentId');
    await queryInterface.removeColumn('Properties', 'performedByAgentId');
    await queryInterface.removeColumn('Payments', 'performedByAgentId');

    // Drop tables in reverse order
    await queryInterface.dropTable('AgentCommissions');
    await queryInterface.dropTable('AgentTransactions');
    await queryInterface.dropTable('CommissionRules');
    await queryInterface.dropTable('AgentApplications');

    // Note: Cannot remove enum value in PostgreSQL easily, would need to recreate the type
  }
};
