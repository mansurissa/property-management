import { Router, Response } from 'express';
import { authenticate, AuthRequest, authorizeOwner } from '../middleware/auth.middleware';
import { sendManagerInvitationEmail } from '../services/email.service';
const { Property, PropertyManager, User } = require('../database/models');

const router = Router();

// All routes require authentication and owner role
router.use(authenticate);
router.use(authorizeOwner);

// GET /managers/properties/:propertyId/managers - List all managers for a property
router.get('/properties/:propertyId/managers', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;

    // Verify the property belongs to the owner
    const property = await Property.findOne({
      where: {
        id: propertyId,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have access'
      });
    }

    const managers = await PropertyManager.findAll({
      where: { propertyId },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    console.error('Get managers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch managers'
    });
  }
});

// POST /managers/properties/:propertyId/managers - Add a manager to a property
router.post('/properties/:propertyId/managers', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { email, permissions } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Manager email is required'
      });
    }

    // Verify the property belongs to the owner
    const property = await Property.findOne({
      where: {
        id: propertyId,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have access'
      });
    }

    // Find or create the manager user
    let managerUser = await User.findOne({ where: { email } });

    if (!managerUser) {
      // Create a new user with manager role (they'll need to set password via reset)
      const crypto = require('crypto');
      const bcrypt = require('bcrypt');
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const resetToken = crypto.randomBytes(32).toString('hex');

      managerUser = await User.create({
        email,
        password: hashedPassword,
        role: 'manager',
        isActive: true,
        passwordResetToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
        passwordResetExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Get inviter's name for the email
      const inviter = await User.findByPk(req.user?.userId);
      const inviterName = inviter
        ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email
        : 'A property owner';

      // Send invitation email with password reset link
      const emailResult = await sendManagerInvitationEmail(
        email,
        inviterName,
        property.name,
        resetToken
      );

      if (!emailResult.success) {
        console.error('Failed to send manager invitation email:', emailResult.message);
      }
    } else if (managerUser.role !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'User exists with a different role. They cannot be added as a manager.'
      });
    }

    // Check if manager is already assigned to this property
    const existingAssignment = await PropertyManager.findOne({
      where: {
        propertyId,
        managerId: managerUser.id
      }
    });

    if (existingAssignment) {
      if (existingAssignment.status === 'revoked') {
        // Reactivate the assignment
        await existingAssignment.update({
          status: 'active',
          permissions: permissions || existingAssignment.permissions
        });

        return res.status(200).json({
          success: true,
          data: existingAssignment,
          message: 'Manager access has been restored'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Manager is already assigned to this property'
      });
    }

    // Create the property manager assignment
    const propertyManager = await PropertyManager.create({
      propertyId,
      managerId: managerUser.id,
      invitedBy: req.user?.userId,
      permissions: permissions || {
        canViewTenants: true,
        canEditTenants: false,
        canViewPayments: true,
        canRecordPayments: false,
        canViewMaintenance: true,
        canManageMaintenance: false,
        canEditProperty: false
      },
      status: 'active'
    });

    // Fetch with manager details
    const result = await PropertyManager.findByPk(propertyManager.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Manager added successfully'
    });
  } catch (error) {
    console.error('Add manager error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add manager'
    });
  }
});

// PUT /managers/properties/:propertyId/managers/:managerId - Update manager permissions
router.put('/properties/:propertyId/managers/:managerId', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, managerId } = req.params;
    const { permissions, status } = req.body;

    // Verify the property belongs to the owner
    const property = await Property.findOne({
      where: {
        id: propertyId,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have access'
      });
    }

    const propertyManager = await PropertyManager.findOne({
      where: {
        propertyId,
        managerId
      }
    });

    if (!propertyManager) {
      return res.status(404).json({
        success: false,
        message: 'Manager assignment not found'
      });
    }

    // Update the assignment
    const updateData: any = {};
    if (permissions) updateData.permissions = permissions;
    if (status && ['active', 'revoked'].includes(status)) updateData.status = status;

    await propertyManager.update(updateData);

    // Fetch updated data with manager details
    const result = await PropertyManager.findByPk(propertyManager.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Manager permissions updated successfully'
    });
  } catch (error) {
    console.error('Update manager error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update manager'
    });
  }
});

// DELETE /managers/properties/:propertyId/managers/:managerId - Remove a manager from property
router.delete('/properties/:propertyId/managers/:managerId', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, managerId } = req.params;

    // Verify the property belongs to the owner
    const property = await Property.findOne({
      where: {
        id: propertyId,
        userId: req.user?.userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not have access'
      });
    }

    const propertyManager = await PropertyManager.findOne({
      where: {
        propertyId,
        managerId
      }
    });

    if (!propertyManager) {
      return res.status(404).json({
        success: false,
        message: 'Manager assignment not found'
      });
    }

    // Soft delete by setting status to revoked (can be reactivated later)
    await propertyManager.update({ status: 'revoked' });

    return res.status(200).json({
      success: true,
      message: 'Manager access revoked successfully'
    });
  } catch (error) {
    console.error('Remove manager error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove manager'
    });
  }
});

// GET /managers/all - List all managers across all properties for the owner
router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    // Get all properties owned by the user
    const properties = await Property.findAll({
      where: { userId: req.user?.userId },
      attributes: ['id']
    });

    const propertyIds = properties.map((p: any) => p.id);

    const managers = await PropertyManager.findAll({
      where: {
        propertyId: propertyIds
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    console.error('Get all managers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch managers'
    });
  }
});

export default router;
