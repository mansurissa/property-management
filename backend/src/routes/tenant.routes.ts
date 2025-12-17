import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  parsePagination,
  sendPaginated,
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  sendServerError,
  sendDeleted,
  sendConflict
} from '../utils/response.utils';
import {
  createTenantValidation,
  updateTenantValidation,
  assignTenantToUnitValidation
} from '../middleware/validators/tenant.validator';
import { validateRequest } from '../middleware/validation.middleware';
import { verifyTenantOwnership } from '../middleware/ownership.middleware';
const { Tenant, Unit, Property, Payment } = require('../database/models');
const db = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /tenants - List all tenants for the authenticated user (with pagination)
// Super admin can see all tenants
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const pagination = parsePagination(req.query);

    const whereClause: any = {};
    // Super admin can see all tenants, others only see their own
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }
    if (status) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: tenants } = await Tenant.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unitNumber', 'monthlyRent'],
          include: [{
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pagination.limit,
      offset: pagination.offset
    });

    return sendPaginated(res, tenants, count, pagination);
  } catch (error) {
    console.error('Get tenants error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch tenants');
  }
});

// GET /tenants/:id - Get a single tenant
// Super admin can view any tenant
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [{
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address']
          }]
        },
        {
          model: Payment,
          as: 'payments',
          limit: 10,
          order: [['paymentDate', 'DESC']]
        }
      ]
    });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    return sendSuccess(res, tenant);
  } catch (error) {
    console.error('Get tenant error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch tenant');
  }
});

// POST /tenants - Create a new tenant
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName, lastName, email, phone, nationalId,
      emergencyContact, emergencyPhone, unitId, leaseStartDate, leaseEndDate
    } = req.body;

    if (!firstName || !lastName || !phone) {
      return sendError(res, 'First name, last name, and phone are required');
    }

    // If unitId is provided, verify user has access (super_admin can access all)
    if (unitId) {
      const propertyWhere: any = {};
      if (req.user?.role !== 'super_admin') {
        propertyWhere.userId = req.user?.userId;
      }

      const unit = await Unit.findByPk(unitId, {
        include: [{
          model: Property,
          as: 'property',
          where: propertyWhere
        }]
      });

      if (!unit) {
        return sendNotFound(res, 'Unit');
      }

      // Check if unit is already occupied
      const existingTenant = await Tenant.findOne({
        where: { unitId, status: 'active' }
      });

      if (existingTenant) {
        return sendConflict(res, 'Unit is already occupied');
      }
    }

    const tenant = await Tenant.create({
      userId: req.user?.userId,
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      emergencyContact,
      emergencyPhone,
      unitId: unitId || null,
      leaseStartDate,
      leaseEndDate,
      status: 'active'
    });

    // Update unit status if assigned
    if (unitId) {
      await Unit.update({ status: 'occupied' }, { where: { id: unitId } });
    }

    return sendCreated(res, tenant, 'Tenant created successfully');
  } catch (error) {
    console.error('Create tenant error:', error);
    return sendServerError(res, error as Error, 'Failed to create tenant');
  }
});

// PUT /tenants/:id - Update a tenant
// Super admin can update any tenant
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({ where: whereClause });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    const {
      firstName, lastName, email, phone, nationalId,
      emergencyContact, emergencyPhone, status, leaseStartDate, leaseEndDate
    } = req.body;

    await tenant.update({
      firstName: firstName || tenant.firstName,
      lastName: lastName || tenant.lastName,
      email: email !== undefined ? email : tenant.email,
      phone: phone || tenant.phone,
      nationalId: nationalId !== undefined ? nationalId : tenant.nationalId,
      emergencyContact: emergencyContact !== undefined ? emergencyContact : tenant.emergencyContact,
      emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : tenant.emergencyPhone,
      status: status || tenant.status,
      leaseStartDate: leaseStartDate !== undefined ? leaseStartDate : tenant.leaseStartDate,
      leaseEndDate: leaseEndDate !== undefined ? leaseEndDate : tenant.leaseEndDate
    });

    return sendSuccess(res, tenant, 'Tenant updated successfully');
  } catch (error) {
    console.error('Update tenant error:', error);
    return sendServerError(res, error as Error, 'Failed to update tenant');
  }
});

// POST /tenants/:id/assign - Assign tenant to a unit
// Super admin can assign any tenant
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { unitId } = req.body;
    const { Op } = require('sequelize');

    if (!unitId) {
      return sendError(res, 'Unit ID is required');
    }

    const tenantWhere: any = { id: req.params.id };
    if (req.user?.role !== 'super_admin') {
      tenantWhere.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({ where: tenantWhere });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    // Verify user has access to the unit (super_admin can access all)
    const propertyWhere: any = {};
    if (req.user?.role !== 'super_admin') {
      propertyWhere.userId = req.user?.userId;
    }

    const unit = await Unit.findByPk(unitId, {
      include: [{
        model: Property,
        as: 'property',
        where: propertyWhere
      }]
    });

    if (!unit) {
      return sendNotFound(res, 'Unit');
    }

    // Check if unit is already occupied by another tenant
    const existingTenant = await Tenant.findOne({
      where: { unitId, status: 'active', id: { [Op.ne]: req.params.id } }
    });

    if (existingTenant) {
      return sendConflict(res, 'Unit is already occupied by another tenant');
    }

    // Unassign from previous unit if any
    if (tenant.unitId) {
      await Unit.update({ status: 'vacant' }, { where: { id: tenant.unitId } });
    }

    // Assign to new unit
    await tenant.update({ unitId, status: 'active' });
    await Unit.update({ status: 'occupied' }, { where: { id: unitId } });

    return sendSuccess(res, tenant, 'Tenant assigned to unit successfully');
  } catch (error) {
    console.error('Assign tenant error:', error);
    return sendServerError(res, error as Error, 'Failed to assign tenant to unit');
  }
});

// POST /tenants/:id/unassign - Unassign tenant from unit
// Super admin can unassign any tenant
router.post('/:id/unassign', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({ where: whereClause });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    if (!tenant.unitId) {
      return sendError(res, 'Tenant is not assigned to any unit');
    }

    // Update unit status
    await Unit.update({ status: 'vacant' }, { where: { id: tenant.unitId } });

    // Update tenant
    await tenant.update({ unitId: null, status: 'exited' });

    return sendSuccess(res, tenant, 'Tenant unassigned from unit successfully');
  } catch (error) {
    console.error('Unassign tenant error:', error);
    return sendServerError(res, error as Error, 'Failed to unassign tenant from unit');
  }
});

// DELETE /tenants/:id - Delete a tenant
// Super admin can delete any tenant
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const tenant = await Tenant.findOne({ where: whereClause });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    // Update unit status if tenant was assigned
    if (tenant.unitId) {
      await Unit.update({ status: 'vacant' }, { where: { id: tenant.unitId } });
    }

    await tenant.destroy();

    return sendDeleted(res, 'Tenant deleted successfully');
  } catch (error) {
    console.error('Delete tenant error:', error);
    return sendServerError(res, error as Error, 'Failed to delete tenant');
  }
});

export default router;
