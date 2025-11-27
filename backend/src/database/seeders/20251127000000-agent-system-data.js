'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Get superadmin ID for reviewedBy
    const [superAdmin] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = 'superadmin@renta.rw' LIMIT 1`
    );
    const superAdminId = superAdmin[0]?.id;

    // Generate IDs
    const agentId = uuidv4();
    const agent2Id = uuidv4();
    const applicationPendingId = uuidv4();
    const applicationApprovedId = uuidv4();
    const applicationRejectedId = uuidv4();

    const rule1Id = uuidv4();
    const rule2Id = uuidv4();
    const rule3Id = uuidv4();
    const rule4Id = uuidv4();

    // ==========================================
    // AGENT USERS (must be created BEFORE applications that reference them)
    // ==========================================
    await queryInterface.bulkInsert('Users', [
      {
        id: agentId,
        email: 'agent@renta.rw',
        password: hashedPassword,
        firstName: 'Jean-Paul',
        lastName: 'Mugisha',
        phone: '+250788200200',
        role: 'agent',
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: agent2Id,
        email: 'agent2@renta.rw',
        password: hashedPassword,
        firstName: 'Aline',
        lastName: 'Umutoni',
        phone: '+250788300300',
        role: 'agent',
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // AGENT APPLICATIONS (after Users are created)
    // ==========================================
    await queryInterface.bulkInsert('AgentApplications', [
      // Pending application (no userId - not approved yet)
      {
        id: applicationPendingId,
        email: 'pending.agent@email.com',
        firstName: 'Marie',
        lastName: 'Uwitonze',
        phone: '+250788100100',
        nationalId: '1199880123456789',
        address: 'KN 5 Rd, Gasabo',
        city: 'Kigali',
        motivation: 'I am passionate about helping property owners manage their rentals effectively. I have excellent communication skills and am eager to earn commissions while providing value.',
        experience: '3 years of experience in real estate sales and customer service.',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Approved application (linked to agent user)
      {
        id: applicationApprovedId,
        email: 'agent@renta.rw',
        firstName: 'Jean-Paul',
        lastName: 'Mugisha',
        phone: '+250788200200',
        nationalId: '1198780234567890',
        address: 'KG 11 Ave, Kacyiru',
        city: 'Kigali',
        motivation: 'I want to help property owners in Rwanda manage their properties more efficiently while earning a sustainable income.',
        experience: '5 years in property management and customer relations.',
        status: 'approved',
        reviewedBy: superAdminId,
        reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        userId: agentId,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      // Another approved agent
      {
        id: uuidv4(),
        email: 'agent2@renta.rw',
        firstName: 'Aline',
        lastName: 'Umutoni',
        phone: '+250788300300',
        nationalId: '1199580345678901',
        address: 'KK 29 St, Gikondo',
        city: 'Kigali',
        motivation: 'Looking to earn extra income by helping landlords with tenant management.',
        experience: '2 years working as a real estate assistant.',
        status: 'approved',
        reviewedBy: superAdminId,
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        userId: agent2Id,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      // Rejected application (no userId - was rejected)
      {
        id: applicationRejectedId,
        email: 'rejected.agent@email.com',
        firstName: 'Patrick',
        lastName: 'Ndayisaba',
        phone: '+250788400400',
        nationalId: '1197880456789012',
        address: 'Unknown',
        city: 'Butare',
        motivation: 'Need money.',
        experience: null,
        status: 'rejected',
        reviewedBy: superAdminId,
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        rejectionReason: 'Insufficient motivation and experience provided. Please reapply with more details about your qualifications.',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ], {});

    // ==========================================
    // COMMISSION RULES
    // ==========================================
    await queryInterface.bulkInsert('CommissionRules', [
      {
        id: rule1Id,
        actionType: 'property_registration',
        name: 'Property Registration Bonus',
        description: 'Fixed commission for helping owners register new properties',
        commissionType: 'fixed',
        commissionValue: 5000,
        isActive: true,
        createdBy: superAdminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: rule2Id,
        actionType: 'tenant_onboarding',
        name: 'Tenant Onboarding Commission',
        description: 'Commission for successfully onboarding new tenants',
        commissionType: 'fixed',
        commissionValue: 10000,
        isActive: true,
        createdBy: superAdminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: rule3Id,
        actionType: 'rent_collection',
        name: 'Rent Collection Commission',
        description: 'Percentage commission on rent payments collected',
        commissionType: 'percentage',
        commissionValue: 2,
        minAmount: 500,
        maxAmount: 20000,
        isActive: true,
        createdBy: superAdminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: rule4Id,
        actionType: 'maintenance_submission',
        name: 'Maintenance Request Commission',
        description: 'Small bonus for helping tenants submit maintenance requests',
        commissionType: 'fixed',
        commissionValue: 500,
        isActive: true,
        createdBy: superAdminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Get an owner for transactions
    const [owner] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = 'jean@renta.rw' LIMIT 1`
    );
    const ownerId = owner[0]?.id;

    // Get a tenant for transactions
    const [tenant] = await queryInterface.sequelize.query(
      `SELECT id FROM "Tenants" WHERE email = 'emmanuel@tenant.rw' LIMIT 1`
    );
    const tenantId = tenant[0]?.id;

    // Get a property for transactions
    const [property] = await queryInterface.sequelize.query(
      `SELECT id FROM "Properties" WHERE name = 'Kigali Heights Apartments' LIMIT 1`
    );
    const propertyId = property[0]?.id;

    // ==========================================
    // SAMPLE AGENT TRANSACTIONS
    // ==========================================
    if (ownerId && propertyId) {
      const tx1Id = uuidv4();
      const tx2Id = uuidv4();
      const tx3Id = uuidv4();

      await queryInterface.bulkInsert('AgentTransactions', [
        {
          id: tx1Id,
          agentId: agentId,
          actionType: 'property_registration',
          targetUserType: 'owner',
          targetUserId: ownerId,
          relatedEntityType: 'property',
          relatedEntityId: propertyId,
          description: 'Helped owner register new property: Kigali Heights Apartments',
          metadata: JSON.stringify({ propertyName: 'Kigali Heights Apartments' }),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: tx2Id,
          agentId: agentId,
          actionType: 'tenant_onboarding',
          targetUserType: 'owner',
          targetUserId: ownerId,
          relatedEntityType: 'tenant',
          relatedEntityId: tenantId || null,
          description: 'Helped onboard tenant Emmanuel Nshimiyimana',
          metadata: JSON.stringify({ tenantName: 'Emmanuel Nshimiyimana' }),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: tx3Id,
          agentId: agentId,
          actionType: 'rent_collection',
          targetUserType: 'owner',
          targetUserId: ownerId,
          relatedEntityType: 'payment',
          description: 'Collected rent payment of 350,000 RWF',
          metadata: JSON.stringify({ paymentAmount: 350000 }),
          transactionAmount: 350000,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      ], {});

      // ==========================================
      // SAMPLE AGENT COMMISSIONS
      // ==========================================
      await queryInterface.bulkInsert('AgentCommissions', [
        {
          id: uuidv4(),
          agentId: agentId,
          transactionId: tx1Id,
          commissionRuleId: rule1Id,
          amount: 5000,
          status: 'paid',
          paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: 'Paid via MoMo',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: uuidv4(),
          agentId: agentId,
          transactionId: tx2Id,
          commissionRuleId: rule2Id,
          amount: 10000,
          status: 'paid',
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Paid via bank transfer',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          id: uuidv4(),
          agentId: agentId,
          transactionId: tx3Id,
          commissionRuleId: rule3Id,
          amount: 7000, // 2% of 350,000
          status: 'pending',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      ], {});
    }

    console.log('\n==========================================');
    console.log('AGENT SYSTEM SEED DATA CREATED');
    console.log('==========================================');
    console.log('AGENT TEST ACCOUNTS (password: password123)');
    console.log('------------------------------------------');
    console.log('Agent 1:       agent@renta.rw');
    console.log('Agent 2:       agent2@renta.rw');
    console.log('');
    console.log('PENDING APPLICATIONS');
    console.log('------------------------------------------');
    console.log('Applicant:     pending.agent@email.com');
    console.log('');
    console.log('COMMISSION RULES CREATED');
    console.log('------------------------------------------');
    console.log('- Property Registration: 5,000 RWF (fixed)');
    console.log('- Tenant Onboarding: 10,000 RWF (fixed)');
    console.log('- Rent Collection: 2% (min 500, max 20,000)');
    console.log('- Maintenance Request: 500 RWF (fixed)');
    console.log('==========================================\n');
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order of foreign key dependencies
    await queryInterface.bulkDelete('AgentCommissions', null, {});
    await queryInterface.bulkDelete('AgentTransactions', null, {});
    await queryInterface.bulkDelete('CommissionRules', null, {});
    await queryInterface.bulkDelete('AgentApplications', null, {});
    await queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.in]: [
          'agent@renta.rw',
          'agent2@renta.rw'
        ]
      }
    }, {});
  }
};
