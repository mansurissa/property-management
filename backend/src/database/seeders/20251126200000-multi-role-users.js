'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Generate UUIDs for all user types
    const superAdminId = uuidv4();
    const agencyId = uuidv4();
    const owner1Id = uuidv4();
    const owner2Id = uuidv4();
    const managerId = uuidv4();
    const tenantUserId = uuidv4();
    const maintenanceStaffId = uuidv4();
    const maintenanceStaff2Id = uuidv4();

    // Property and Unit IDs
    const property1Id = uuidv4();
    const property2Id = uuidv4();
    const property3Id = uuidv4();

    const unit1Id = uuidv4();
    const unit2Id = uuidv4();
    const unit3Id = uuidv4();
    const unit4Id = uuidv4();
    const unit5Id = uuidv4();
    const unit6Id = uuidv4();

    // Tenant IDs
    const tenant1Id = uuidv4();
    const tenant2Id = uuidv4();
    const tenant3Id = uuidv4();
    const tenant4Id = uuidv4();

    // ==========================================
    // USERS - All 5 Role Types
    // ==========================================
    await queryInterface.bulkInsert('Users', [
      // Super Admin
      {
        id: superAdminId,
        email: 'superadmin@renta.rw',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+250788000000',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Agency
      {
        id: agencyId,
        email: 'agency@renta.rw',
        password: hashedPassword,
        firstName: 'Kigali',
        lastName: 'Properties Agency',
        phone: '+250788000001',
        role: 'agency',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Owner 1
      {
        id: owner1Id,
        email: 'jean@renta.rw',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Mutsinzi',
        phone: '+250788123456',
        role: 'owner',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Owner 2
      {
        id: owner2Id,
        email: 'alice@renta.rw',
        password: hashedPassword,
        firstName: 'Alice',
        lastName: 'Uwimana',
        phone: '+250788654321',
        role: 'owner',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Tenant User (linked to tenant record)
      {
        id: tenantUserId,
        email: 'emmanuel@tenant.rw',
        password: hashedPassword,
        firstName: 'Emmanuel',
        lastName: 'Nshimiyimana',
        phone: '+250788111222',
        role: 'tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Maintenance Staff 1
      {
        id: maintenanceStaffId,
        email: 'fixer@renta.rw',
        password: hashedPassword,
        firstName: 'Pierre',
        lastName: 'Habimana',
        phone: '+250788555666',
        role: 'maintenance',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Maintenance Staff 2
      {
        id: maintenanceStaff2Id,
        email: 'technician@renta.rw',
        password: hashedPassword,
        firstName: 'Claude',
        lastName: 'Mugabo',
        phone: '+250788555777',
        role: 'maintenance',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Property Manager
      {
        id: managerId,
        email: 'manager@renta.rw',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Karangwa',
        phone: '+250788666777',
        role: 'manager',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // PROPERTIES (some managed by agency)
    // ==========================================
    await queryInterface.bulkInsert('Properties', [
      {
        id: property1Id,
        userId: owner1Id,
        agencyId: agencyId, // Managed by agency
        name: 'Kigali Heights Apartments',
        type: 'apartment',
        address: 'KG 7 Ave, Kimihurura',
        city: 'Kigali',
        description: 'Modern apartment complex in the heart of Kimihurura with parking and 24/7 security.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: property2Id,
        userId: owner1Id,
        agencyId: agencyId, // Managed by agency
        name: 'Nyarutarama Residences',
        type: 'house',
        address: 'KG 9 Ave, Nyarutarama',
        city: 'Kigali',
        description: 'Premium residential houses in Nyarutarama with garden and swimming pool.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: property3Id,
        userId: owner2Id,
        agencyId: null, // Self-managed
        name: 'Remera Commercial Plaza',
        type: 'commercial',
        address: 'KK 15 Rd, Remera',
        city: 'Kigali',
        description: 'Commercial spaces ideal for offices and shops near Remera taxi park.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // UNITS
    // ==========================================
    await queryInterface.bulkInsert('Units', [
      {
        id: unit1Id,
        propertyId: property1Id,
        unitNumber: 'A101',
        floor: 1,
        bedrooms: 2,
        bathrooms: 1,
        monthlyRent: 350000,
        paymentDueDay: 5,
        status: 'occupied',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: unit2Id,
        propertyId: property1Id,
        unitNumber: 'A102',
        floor: 1,
        bedrooms: 1,
        bathrooms: 1,
        monthlyRent: 200000,
        paymentDueDay: 5,
        status: 'occupied',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: unit3Id,
        propertyId: property1Id,
        unitNumber: 'A201',
        floor: 2,
        bedrooms: 3,
        bathrooms: 2,
        monthlyRent: 500000,
        paymentDueDay: 5,
        status: 'vacant',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: unit4Id,
        propertyId: property1Id,
        unitNumber: 'A202',
        floor: 2,
        bedrooms: 2,
        bathrooms: 1,
        monthlyRent: 320000,
        paymentDueDay: 5,
        status: 'occupied',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: unit5Id,
        propertyId: property2Id,
        unitNumber: 'H1',
        floor: 0,
        bedrooms: 4,
        bathrooms: 3,
        monthlyRent: 1200000,
        paymentDueDay: 1,
        status: 'occupied',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: unit6Id,
        propertyId: property2Id,
        unitNumber: 'H2',
        floor: 0,
        bedrooms: 3,
        bathrooms: 2,
        monthlyRent: 800000,
        paymentDueDay: 1,
        status: 'vacant',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // TENANTS (one linked to user account)
    // ==========================================
    const leaseStart = new Date('2024-01-01');
    const leaseEnd = new Date('2024-12-31');

    await queryInterface.bulkInsert('Tenants', [
      {
        id: tenant1Id,
        userId: owner1Id,
        userAccountId: tenantUserId, // Linked to tenant user account for login
        unitId: unit1Id,
        firstName: 'Emmanuel',
        lastName: 'Nshimiyimana',
        email: 'emmanuel@tenant.rw',
        phone: '+250788111222',
        nationalId: '1199880012345678',
        leaseStartDate: leaseStart,
        leaseEndDate: leaseEnd,
        status: 'active',
        emergencyContact: 'Marie Nshimiyimana',
        emergencyPhone: '+250788999888',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: tenant2Id,
        userId: owner1Id,
        userAccountId: null, // No login access
        unitId: unit2Id,
        firstName: 'Grace',
        lastName: 'Mukamana',
        email: 'grace.m@email.com',
        phone: '+250788222333',
        nationalId: '1199580054321678',
        leaseStartDate: leaseStart,
        leaseEndDate: leaseEnd,
        status: 'active',
        emergencyContact: 'Paul Mukamana',
        emergencyPhone: '+250788777666',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: tenant3Id,
        userId: owner1Id,
        userAccountId: null,
        unitId: unit4Id,
        firstName: 'Patrick',
        lastName: 'Habimana',
        email: 'patrick.h@email.com',
        phone: '+250788333444',
        nationalId: '1198880076543210',
        leaseStartDate: leaseStart,
        leaseEndDate: leaseEnd,
        status: 'active',
        emergencyContact: null,
        emergencyPhone: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: tenant4Id,
        userId: owner1Id,
        userAccountId: null,
        unitId: unit5Id,
        firstName: 'Diane',
        lastName: 'Ingabire',
        email: 'diane.i@email.com',
        phone: '+250788444555',
        nationalId: '1199080098765432',
        leaseStartDate: new Date('2024-06-01'),
        leaseEndDate: new Date('2025-05-31'),
        status: 'active',
        emergencyContact: 'Claude Ingabire',
        emergencyPhone: '+250788555444',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // PAYMENTS
    // ==========================================
    await queryInterface.bulkInsert('Payments', [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        unitId: unit1Id,
        amount: 350000,
        paymentDate: new Date('2024-11-05'),
        paymentMethod: 'momo',
        periodMonth: 11,
        periodYear: 2024,
        notes: 'November 2024 rent - Paid on time via MTN MoMo',
        receivedBy: owner1Id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        unitId: unit2Id,
        amount: 200000,
        paymentDate: new Date('2024-11-03'),
        paymentMethod: 'bank',
        periodMonth: 11,
        periodYear: 2024,
        notes: 'November 2024 rent - Bank of Kigali transfer',
        receivedBy: owner1Id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        tenantId: tenant3Id,
        unitId: unit4Id,
        amount: 320000,
        paymentDate: new Date('2024-11-06'),
        paymentMethod: 'cash',
        periodMonth: 11,
        periodYear: 2024,
        notes: 'November 2024 rent - Cash payment',
        receivedBy: owner1Id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        tenantId: tenant4Id,
        unitId: unit5Id,
        amount: 1200000,
        paymentDate: new Date('2024-11-01'),
        paymentMethod: 'bank',
        periodMonth: 11,
        periodYear: 2024,
        notes: 'November 2024 rent - Premium unit',
        receivedBy: owner1Id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // PROPERTY MANAGERS (assign manager to properties)
    // ==========================================
    await queryInterface.bulkInsert('PropertyManagers', [
      {
        id: uuidv4(),
        propertyId: property1Id,
        managerId: managerId,
        permissions: JSON.stringify({
          canViewTenants: true,
          canEditTenants: true,
          canViewPayments: true,
          canRecordPayments: true,
          canViewMaintenance: true,
          canManageMaintenance: true,
          canEditProperty: false
        }),
        invitedBy: owner1Id,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        propertyId: property2Id,
        managerId: managerId,
        permissions: JSON.stringify({
          canViewTenants: true,
          canEditTenants: false,
          canViewPayments: true,
          canRecordPayments: false,
          canViewMaintenance: true,
          canManageMaintenance: false,
          canEditProperty: false
        }),
        invitedBy: owner1Id,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // ==========================================
    // MAINTENANCE TICKETS (some assigned to staff)
    // ==========================================
    await queryInterface.bulkInsert('MaintenanceTickets', [
      {
        id: uuidv4(),
        unitId: unit1Id,
        tenantId: tenant1Id,
        assignedTo: maintenanceStaffId, // Assigned to Pierre
        category: 'plumbing',
        description: 'Kitchen sink is leaking under the cabinet. Water damage visible.',
        priority: 'high',
        status: 'in_progress',
        completedAt: null,
        createdAt: new Date('2024-11-20'),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        unitId: unit2Id,
        tenantId: tenant2Id,
        assignedTo: maintenanceStaff2Id, // Assigned to Claude
        category: 'electrical',
        description: 'Bedroom light switch not working properly, sometimes sparks.',
        priority: 'urgent',
        status: 'in_progress',
        completedAt: null,
        createdAt: new Date('2024-11-24'),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        unitId: unit4Id,
        tenantId: tenant3Id,
        assignedTo: null, // Not yet assigned
        category: 'appliance',
        description: 'Air conditioning unit making loud noise and not cooling properly.',
        priority: 'medium',
        status: 'pending',
        completedAt: null,
        createdAt: new Date('2024-11-23'),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        unitId: unit1Id,
        tenantId: tenant1Id,
        assignedTo: maintenanceStaffId,
        category: 'structural',
        description: 'Small crack appeared on bathroom wall after recent rains.',
        priority: 'low',
        status: 'completed',
        completedAt: new Date('2024-11-15'),
        createdAt: new Date('2024-11-10'),
        updatedAt: new Date('2024-11-15')
      }
    ], {});

    console.log('Multi-role seed data created successfully!');
    console.log('\n==========================================');
    console.log('TEST ACCOUNTS (all passwords: password123)');
    console.log('==========================================');
    console.log('Super Admin:  superadmin@renta.rw');
    console.log('Agency:       agency@renta.rw');
    console.log('Owner:        jean@renta.rw');
    console.log('Owner:        alice@renta.rw');
    console.log('Manager:      manager@renta.rw');
    console.log('Tenant:       emmanuel@tenant.rw');
    console.log('Maintenance:  fixer@renta.rw');
    console.log('Maintenance:  technician@renta.rw');
    console.log('==========================================\n');
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order of foreign key dependencies
    await queryInterface.bulkDelete('MaintenanceTickets', null, {});
    await queryInterface.bulkDelete('PropertyManagers', null, {});
    await queryInterface.bulkDelete('Payments', null, {});
    await queryInterface.bulkDelete('Tenants', null, {});
    await queryInterface.bulkDelete('Units', null, {});
    await queryInterface.bulkDelete('Properties', null, {});
    await queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.in]: [
          'superadmin@renta.rw',
          'agency@renta.rw',
          'jean@renta.rw',
          'alice@renta.rw',
          'manager@renta.rw',
          'emmanuel@tenant.rw',
          'fixer@renta.rw',
          'technician@renta.rw'
        ]
      }
    }, {});
  }
};
