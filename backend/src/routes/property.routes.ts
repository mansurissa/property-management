import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
const { Property, Unit } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /properties - List all properties for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const properties = await Property.findAll({
      where: { userId: req.user?.userId },
      include: [
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unitNumber', 'status', 'monthlyRent']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
});

// GET /properties/:id - Get a single property
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      },
      include: [
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unitNumber', 'floor', 'bedrooms', 'bathrooms', 'monthlyRent', 'status', 'paymentDueDay']
        }
      ]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Get property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
});

// POST /properties - Create a new property
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, address, city, description } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name and address are required'
      });
    }

    const property = await Property.create({
      userId: req.user?.userId,
      name,
      type: type || 'apartment',
      address,
      city: city || 'Kigali',
      description
    });

    return res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('Create property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  }
});

// PUT /properties/:id - Update a property
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const { name, type, address, city, description } = req.body;

    await property.update({
      name: name || property.name,
      type: type || property.type,
      address: address || property.address,
      city: city || property.city,
      description: description !== undefined ? description : property.description
    });

    return res.status(200).json({
      success: true,
      data: property,
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('Update property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  }
});

// DELETE /properties/:id - Delete a property
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await property.destroy();

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    });
  }
});

export default router;
