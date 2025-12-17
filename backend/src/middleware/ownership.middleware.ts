import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendNotFound } from '../utils/response.utils';

const { Property, Unit, Tenant, Payment, MaintenanceRequest, Document, PropertyManager } = require('../database/models');

/**
 * Middleware to verify property ownership or manager access
 * Checks if the authenticated user owns the property or is a manager with access
 */
export const verifyPropertyOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const propertyId = req.params.propertyId || req.params.id || req.body.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    const property = await Property.findByPk(propertyId);

    if (!property) {
      return sendNotFound(res, 'Property');
    }

    // Super admin has access to everything
    if (req.user?.role === 'super_admin') {
      req.property = property;
      return next();
    }

    // Check if user owns the property
    if (property.userId === req.user?.userId) {
      req.property = property;
      return next();
    }

    // Check if user is a manager with access to this property
    if (req.user?.role === 'manager') {
      const managerAccess = await PropertyManager.findOne({
        where: { propertyId, managerId: req.user?.userId }
      });

      if (managerAccess) {
        req.property = property;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this property.'
    });
  } catch (error) {
    console.error('Error verifying property ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify property ownership'
    });
  }
};

/**
 * Middleware to verify tenant ownership or access
 * Checks if the authenticated user owns the tenant record or is the tenant themselves
 */
export const verifyTenantOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.params.tenantId || req.params.id || req.body.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      include: [{ model: Unit, as: 'unit', include: [{ model: Property, as: 'property' }] }]
    });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    // Super admin has access to everything
    if (req.user?.role === 'super_admin') {
      req.tenant = tenant;
      return next();
    }

    // Check if user owns the tenant record (property owner)
    if (tenant.userId === req.user?.userId) {
      req.tenant = tenant;
      return next();
    }

    // Check if user is the tenant themselves
    if (req.user?.role === 'tenant' && tenant.userId === req.user?.userId) {
      req.tenant = tenant;
      return next();
    }

    // Check if user is a manager with access to the property
    if (req.user?.role === 'manager' && tenant.unit?.property) {
      const managerAccess = await PropertyManager.findOne({
        where: { propertyId: tenant.unit.property.id, managerId: req.user?.userId }
      });

      if (managerAccess) {
        req.tenant = tenant;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this tenant.'
    });
  } catch (error) {
    console.error('Error verifying tenant ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify tenant ownership'
    });
  }
};

/**
 * Middleware to verify unit ownership or access
 */
export const verifyUnitOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const unitId = req.params.unitId || req.params.id || req.body.unitId;
    const propertyId = req.params.propertyId || req.body.propertyId;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: 'Unit ID is required'
      });
    }

    const unit = await Unit.findByPk(unitId, {
      include: [{ model: Property, as: 'property' }]
    });

    if (!unit) {
      return sendNotFound(res, 'Unit');
    }

    // Verify the unit belongs to the specified property
    if (propertyId && unit.propertyId !== propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Unit does not belong to the specified property'
      });
    }

    // Super admin has access to everything
    if (req.user?.role === 'super_admin') {
      req.unit = unit;
      return next();
    }

    // Check if user owns the property
    if (unit.property && unit.property.userId === req.user?.userId) {
      req.unit = unit;
      return next();
    }

    // Check if user is a manager with access to the property
    if (req.user?.role === 'manager' && unit.property) {
      const managerAccess = await PropertyManager.findOne({
        where: { propertyId: unit.property.id, managerId: req.user?.userId }
      });

      if (managerAccess) {
        req.unit = unit;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this unit.'
    });
  } catch (error) {
    console.error('Error verifying unit ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify unit ownership'
    });
  }
};

/**
 * Middleware to verify payment ownership or access
 */
export const verifyPaymentOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.params.paymentId || req.params.id;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const payment = await Payment.findByPk(paymentId, {
      include: [{
        model: Tenant,
        as: 'tenant',
        include: [{ model: Unit, as: 'unit', include: [{ model: Property, as: 'property' }] }]
      }]
    });

    if (!payment) {
      return sendNotFound(res, 'Payment');
    }

    // Super admin has access to everything
    if (req.user?.role === 'super_admin') {
      req.payment = payment;
      return next();
    }

    // Check if user owns the payment record (property owner)
    if (payment.userId === req.user?.userId) {
      req.payment = payment;
      return next();
    }

    // Check if user is a manager with access to the property
    if (req.user?.role === 'manager' && payment.tenant?.unit?.property) {
      const managerAccess = await PropertyManager.findOne({
        where: { propertyId: payment.tenant.unit.property.id, managerId: req.user?.userId }
      });

      if (managerAccess) {
        req.payment = payment;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this payment.'
    });
  } catch (error) {
    console.error('Error verifying payment ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment ownership'
    });
  }
};

/**
 * Middleware to verify maintenance request ownership or access
 */
export const verifyMaintenanceOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const maintenanceId = req.params.maintenanceId || req.params.id;

    if (!maintenanceId) {
      return res.status(400).json({
        success: false,
        message: 'Maintenance request ID is required'
      });
    }

    const maintenance = await MaintenanceRequest.findByPk(maintenanceId, {
      include: [
        { model: Property, as: 'property' },
        { model: Unit, as: 'unit' }
      ]
    });

    if (!maintenance) {
      return sendNotFound(res, 'Maintenance request');
    }

    // Super admin has access to everything
    if (req.user?.role === 'super_admin') {
      req.maintenance = maintenance;
      return next();
    }

    // Check if user created the maintenance request
    if (maintenance.requestedBy === req.user?.userId) {
      req.maintenance = maintenance;
      return next();
    }

    // Check if user owns the property
    if (maintenance.property && maintenance.property.userId === req.user?.userId) {
      req.maintenance = maintenance;
      return next();
    }

    // Check if user is assigned as maintenance staff
    if (req.user?.role === 'maintenance' && maintenance.assignedTo === req.user?.userId) {
      req.maintenance = maintenance;
      return next();
    }

    // Check if user is a manager with access to the property
    if (req.user?.role === 'manager' && maintenance.property) {
      const managerAccess = await PropertyManager.findOne({
        where: { propertyId: maintenance.property.id, managerId: req.user?.userId }
      });

      if (managerAccess) {
        req.maintenance = maintenance;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this maintenance request.'
    });
  } catch (error) {
    console.error('Error verifying maintenance ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify maintenance ownership'
    });
  }
};

/**
 * Middleware to verify document ownership or access
 */
export const verifyDocumentOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const documentId = req.params.documentId || req.params.id;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    const document = await Document.findByPk(documentId);

    if (!document) {
      return sendNotFound(res, 'Document');
    }

    // Super admin has access to everything
    if (req.user?.role === 'super_admin') {
      req.document = document;
      return next();
    }

    // Check if user owns the document
    if (document.userId === req.user?.userId) {
      req.document = document;
      return next();
    }

    // If document is for a tenant, check if current user is that tenant
    if (document.entityType === 'tenant' && req.user?.role === 'tenant') {
      const tenant = await Tenant.findOne({
        where: { id: document.entityId, userId: req.user?.userId }
      });

      if (tenant) {
        req.document = document;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this document.'
    });
  } catch (error) {
    console.error('Error verifying document ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify document ownership'
    });
  }
};

// Extend AuthRequest interface to include resource objects
declare module './auth.middleware' {
  interface AuthRequest {
    property?: any;
    tenant?: any;
    unit?: any;
    payment?: any;
    maintenance?: any;
    document?: any;
  }
}
