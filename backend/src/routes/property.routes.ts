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
  sendDeleted
} from '../utils/response.utils';
import { logAction } from '../services/audit.service';
const { Property, Unit, Tenant } = require('../database/models');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /properties - List all properties for the authenticated user (with pagination)
// Super admin can see all properties
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, type, city } = req.query;
    const pagination = parsePagination(req.query);
    const { Op } = require('sequelize');

    const whereClause: any = {};

    // Super admin can see all properties, others only see their own
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    if (city) {
      whereClause.city = city;
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unitNumber', 'status', 'monthlyRent']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true // Important for accurate count with includes
    });

    return sendPaginated(res, properties, count, pagination);
  } catch (error) {
    console.error('Get properties error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch properties');
  }
});

// GET /properties/:id - Get a single property
// Super admin can view any property
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };

    // Super admin can view any property, others only their own
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const property = await Property.findOne({
      where: whereClause,
      include: [
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unitNumber', 'floor', 'bedrooms', 'bathrooms', 'monthlyRent', 'status', 'paymentDueDay']
        }
      ]
    });

    if (!property) {
      return sendNotFound(res, 'Property');
    }

    return sendSuccess(res, property);
  } catch (error) {
    console.error('Get property error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch property');
  }
});

// POST /properties - Create a new property
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, address, city, description } = req.body;

    if (!name || !address) {
      return sendError(res, 'Name and address are required');
    }

    const property = await Property.create({
      userId: req.user?.userId,
      name,
      type: type || 'apartment',
      address,
      city: city || 'Kigali',
      description
    });

    return sendCreated(res, property, 'Property created successfully');
  } catch (error) {
    console.error('Create property error:', error);
    return sendServerError(res, error as Error, 'Failed to create property');
  }
});

// PUT /properties/:id - Update a property
// Super admin can update any property
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };

    // Super admin can update any property, others only their own
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const property = await Property.findOne({ where: whereClause });

    if (!property) {
      return sendNotFound(res, 'Property');
    }

    const { name, type, address, city, description, isActive } = req.body;

    await property.update({
      name: name || property.name,
      type: type || property.type,
      address: address || property.address,
      city: city || property.city,
      description: description !== undefined ? description : property.description,
      isActive: isActive !== undefined ? isActive : property.isActive
    });

    return sendSuccess(res, property, 'Property updated successfully');
  } catch (error) {
    console.error('Update property error:', error);
    return sendServerError(res, error as Error, 'Failed to update property');
  }
});

// DELETE /properties/:id - Soft delete a property
// Super admin can delete any property
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const whereClause: any = { id: req.params.id };

    // Super admin can delete any property, others only their own
    if (req.user?.role !== 'super_admin') {
      whereClause.userId = req.user?.userId;
    }

    const property = await Property.findOne({
      where: whereClause,
      include: [{
        model: Unit,
        as: 'units',
        include: [{
          model: Tenant,
          as: 'tenant',
          where: { status: 'active' },
          required: false
        }]
      }]
    });

    if (!property) {
      return sendNotFound(res, 'Property');
    }

    // Check if any units have active tenants
    const unitsWithActiveTenants = property.units?.filter(
      (unit: any) => unit.tenant && unit.tenant.status === 'active'
    );

    if (unitsWithActiveTenants && unitsWithActiveTenants.length > 0) {
      return sendError(
        res,
        `Cannot delete property with ${unitsWithActiveTenants.length} active tenant(s). Please remove tenants first.`
      );
    }

    // Soft delete - mark as deleted instead of destroying
    await property.update({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user?.userId
    });

    // Log the deletion
    await logAction({
      userId: req.user!.userId,
      action: 'property.delete',
      entityType: 'property',
      entityId: property.id,
      description: `Soft deleted property "${property.name}" at ${property.address}`,
      metadata: {
        propertyName: property.name,
        address: property.address,
        unitCount: property.units?.length || 0
      }
    });

    return sendDeleted(res, 'Property deleted successfully');
  } catch (error) {
    console.error('Delete property error:', error);
    return sendServerError(res, error as Error, 'Failed to delete property');
  }
});

// POST /properties/:id/restore - Restore a soft-deleted property
router.post('/:id/restore', async (req: AuthRequest, res: Response) => {
  try {
    // Use unscoped to find deleted properties
    const property = await Property.scope('withDeleted').findOne({
      where: {
        id: req.params.id,
        userId: req.user?.userId,
        isDeleted: true
      }
    });

    if (!property) {
      return sendNotFound(res, 'Deleted property');
    }

    await property.update({
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    });

    await logAction({
      userId: req.user!.userId,
      action: 'property.restore',
      entityType: 'property',
      entityId: property.id,
      description: `Restored property "${property.name}"`,
      metadata: { propertyName: property.name }
    });

    return sendSuccess(res, property, 'Property restored successfully');
  } catch (error) {
    console.error('Restore property error:', error);
    return sendServerError(res, error as Error, 'Failed to restore property');
  }
});

// GET /properties/deleted - List soft-deleted properties
router.get('/deleted/list', async (req: AuthRequest, res: Response) => {
  try {
    const properties = await Property.scope('onlyDeleted').findAll({
      where: { userId: req.user?.userId },
      order: [['deletedAt', 'DESC']]
    });

    return sendSuccess(res, properties);
  } catch (error) {
    console.error('Get deleted properties error:', error);
    return sendServerError(res, error as Error, 'Failed to fetch deleted properties');
  }
});

export default router;
