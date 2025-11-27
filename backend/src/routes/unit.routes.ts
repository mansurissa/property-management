import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { Unit, Property, Tenant, Payment, MaintenanceTicket } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /properties/:propertyId/units - List all units for a property
router.get('/property/:propertyId', async (req: AuthRequest, res: Response) => {
  try {
    // First verify the property belongs to the user
    const property = await Property.findOne({
      where: {
        id: req.params.propertyId,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const units = await Unit.findAll({
      where: { propertyId: req.params.propertyId },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'status']
        }
      ],
      order: [['unitNumber', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('Get units error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch units'
    });
  }
});

// GET /units/:id - Get a single unit
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
      include: [
        {
          model: Property,
          as: 'property',
          where: { userId: req.user?.userId },
          attributes: ['id', 'name', 'address']
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'leaseStartDate', 'leaseEndDate']
        }
      ]
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Get unit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unit'
    });
  }
});

// POST /units - Create a new unit
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, unitNumber, floor, bedrooms, bathrooms, monthlyRent, paymentDueDay } = req.body;

    if (!propertyId || !unitNumber || !monthlyRent) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, unit number, and monthly rent are required'
      });
    }

    // Verify the property belongs to the user
    const property = await Property.findOne({
      where: {
        id: propertyId,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const unit = await Unit.create({
      propertyId,
      unitNumber,
      floor: floor || null,
      bedrooms: bedrooms || 1,
      bathrooms: bathrooms || 1,
      monthlyRent,
      paymentDueDay: paymentDueDay || 1,
      status: 'vacant'
    });

    return res.status(201).json({
      success: true,
      data: unit,
      message: 'Unit created successfully'
    });
  } catch (error) {
    console.error('Create unit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create unit'
    });
  }
});

// PUT /units/:id - Update a unit
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
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

    const { unitNumber, floor, bedrooms, bathrooms, monthlyRent, paymentDueDay, status } = req.body;

    await unit.update({
      unitNumber: unitNumber || unit.unitNumber,
      floor: floor !== undefined ? floor : unit.floor,
      bedrooms: bedrooms || unit.bedrooms,
      bathrooms: bathrooms || unit.bathrooms,
      monthlyRent: monthlyRent || unit.monthlyRent,
      paymentDueDay: paymentDueDay || unit.paymentDueDay,
      status: status || unit.status
    });

    return res.status(200).json({
      success: true,
      data: unit,
      message: 'Unit updated successfully'
    });
  } catch (error) {
    console.error('Update unit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update unit'
    });
  }
});

// DELETE /units/:id - Delete a unit
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
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

    await unit.destroy();

    return res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    console.error('Delete unit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete unit'
    });
  }
});

export default router;
