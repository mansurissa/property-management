import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { Tenant, Unit, Property, Payment } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /tenants - List all tenants for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const whereClause: any = { userId: req.user?.userId };
    if (status) {
      whereClause.status = status;
    }

    const tenants = await Tenant.findAll({
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
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants'
    });
  }
});

// GET /tenants/:id - Get a single tenant
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenant = await Tenant.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      },
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
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant'
    });
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
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and phone are required'
      });
    }

    // If unitId is provided, verify it belongs to the user
    if (unitId) {
      const unit = await Unit.findByPk(unitId, {
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user?.userId }
        }]
      });

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      // Check if unit is already occupied
      const existingTenant = await Tenant.findOne({
        where: { unitId, status: 'active' }
      });

      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Unit is already occupied'
        });
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

    return res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create tenant'
    });
  }
});

// PUT /tenants/:id - Update a tenant
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenant = await Tenant.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
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

    return res.status(200).json({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update tenant'
    });
  }
});

// POST /tenants/:id/assign - Assign tenant to a unit
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { unitId } = req.body;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: 'Unit ID is required'
      });
    }

    const tenant = await Tenant.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Verify the unit belongs to the user
    const unit = await Unit.findByPk(unitId, {
      include: [{
        model: Property,
        as: 'property',
        where: { userId: req.user?.userId }
      }]
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Check if unit is already occupied by another tenant
    const existingTenant = await Tenant.findOne({
      where: { unitId, status: 'active', id: { [require('sequelize').Op.ne]: req.params.id } }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Unit is already occupied by another tenant'
      });
    }

    // Unassign from previous unit if any
    if (tenant.unitId) {
      await Unit.update({ status: 'vacant' }, { where: { id: tenant.unitId } });
    }

    // Assign to new unit
    await tenant.update({ unitId, status: 'active' });
    await Unit.update({ status: 'occupied' }, { where: { id: unitId } });

    return res.status(200).json({
      success: true,
      data: tenant,
      message: 'Tenant assigned to unit successfully'
    });
  } catch (error) {
    console.error('Assign tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign tenant to unit'
    });
  }
});

// POST /tenants/:id/unassign - Unassign tenant from unit
router.post('/:id/unassign', async (req: AuthRequest, res: Response) => {
  try {
    const tenant = await Tenant.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (!tenant.unitId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant is not assigned to any unit'
      });
    }

    // Update unit status
    await Unit.update({ status: 'vacant' }, { where: { id: tenant.unitId } });

    // Update tenant
    await tenant.update({ unitId: null, status: 'exited' });

    return res.status(200).json({
      success: true,
      data: tenant,
      message: 'Tenant unassigned from unit successfully'
    });
  } catch (error) {
    console.error('Unassign tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unassign tenant from unit'
    });
  }
});

// DELETE /tenants/:id - Delete a tenant
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenant = await Tenant.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update unit status if tenant was assigned
    if (tenant.unitId) {
      await Unit.update({ status: 'vacant' }, { where: { id: tenant.unitId } });
    }

    await tenant.destroy();

    return res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete tenant'
    });
  }
});

export default router;
