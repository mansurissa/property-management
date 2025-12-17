import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  getAllUserDocuments,
  DocumentType,
  DocumentEntityType
} from '../services/document.service';
import { logDocumentUploaded } from '../services/audit.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendServerError,
  sendDeleted
} from '../utils/response.utils';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max
  }
});

// All routes require authentication
router.use(authenticate);

// GET /documents - Get all documents for the user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, documentType } = req.query;

    const result = await getAllUserDocuments(req.user!.userId, {
      entityType: entityType as DocumentEntityType,
      documentType: documentType as DocumentType
    });

    return sendSuccess(res, {
      documents: result.documents,
      total: result.total
    });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch documents');
  }
});

// GET /documents/:id - Get a specific document
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await getDocumentById(req.params.id, req.user!.userId);

    if (!document) {
      return sendNotFound(res, 'Document');
    }

    return sendSuccess(res, document);
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch document');
  }
});

// GET /documents/entity/:entityType/:entityId - Get documents for a specific entity
router.get('/entity/:entityType/:entityId', async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const result = await getDocuments(
      entityType as DocumentEntityType,
      entityId,
      req.user!.userId
    );

    return sendSuccess(res, {
      documents: result.documents,
      total: result.total
    });
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to fetch documents');
  }
});

// POST /documents - Upload a new document
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded');
    }

    const { entityType, entityId, documentType, description } = req.body;

    if (!entityType || !entityId || !documentType) {
      return sendError(res, 'Entity type, entity ID, and document type are required');
    }

    // Validate entity type
    const validEntityTypes: DocumentEntityType[] = ['tenant', 'property', 'unit', 'payment'];
    if (!validEntityTypes.includes(entityType)) {
      return sendError(res, `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    // Validate document type
    const validDocTypes: DocumentType[] = [
      'lease_agreement', 'id_copy', 'proof_of_income', 'reference_letter',
      'property_deed', 'insurance', 'inspection_report', 'receipt', 'other'
    ];
    if (!validDocTypes.includes(documentType)) {
      return sendError(res, `Invalid document type. Must be one of: ${validDocTypes.join(', ')}`);
    }

    const result = await uploadDocument(req.file, {
      userId: req.user!.userId,
      entityType,
      entityId,
      documentType,
      description
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to upload document');
    }

    // Log audit trail
    await logDocumentUploaded(
      req.user!.userId,
      result.document!.id,
      result.document!.name,
      entityType,
      entityId
    );

    return sendCreated(res, result.document, 'Document uploaded successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to upload document');
  }
});

// DELETE /documents/:id - Delete a document
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await deleteDocument(req.params.id, req.user!.userId);

    if (!result.success) {
      if (result.error === 'Document not found') {
        return sendNotFound(res, 'Document');
      }
      return sendError(res, result.error || 'Failed to delete document');
    }

    return sendDeleted(res, 'Document deleted successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to delete document');
  }
});

// POST /documents/tenant/:tenantId - Upload document for a tenant
router.post('/tenant/:tenantId', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded');
    }

    const { tenantId } = req.params;
    const { documentType, description } = req.body;

    // Verify tenant belongs to user
    const { Tenant } = require('../database/models');
    const tenant = await Tenant.findOne({
      where: { id: tenantId, userId: req.user?.userId }
    });

    if (!tenant) {
      return sendNotFound(res, 'Tenant');
    }

    const result = await uploadDocument(req.file, {
      userId: req.user!.userId,
      entityType: 'tenant',
      entityId: tenantId,
      documentType: documentType || 'other',
      description
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to upload document');
    }

    await logDocumentUploaded(
      req.user!.userId,
      result.document!.id,
      result.document!.name,
      'tenant',
      tenantId
    );

    return sendCreated(res, result.document, 'Document uploaded successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to upload document');
  }
});

// POST /documents/property/:propertyId - Upload document for a property
router.post('/property/:propertyId', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded');
    }

    const { propertyId } = req.params;
    const { documentType, description } = req.body;

    // Verify property belongs to user
    const { Property } = require('../database/models');
    const property = await Property.findOne({
      where: { id: propertyId, userId: req.user?.userId }
    });

    if (!property) {
      return sendNotFound(res, 'Property');
    }

    const result = await uploadDocument(req.file, {
      userId: req.user!.userId,
      entityType: 'property',
      entityId: propertyId,
      documentType: documentType || 'other',
      description
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to upload document');
    }

    await logDocumentUploaded(
      req.user!.userId,
      result.document!.id,
      result.document!.name,
      'property',
      propertyId
    );

    return sendCreated(res, result.document, 'Document uploaded successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to upload document');
  }
});

// PATCH /documents/:id/status - Update document status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { Document } = require('../database/models');
    const { status, signatureMethod, notes } = req.body;

    // Find document
    const document = await Document.findOne({
      where: { id: req.params.id, userId: req.user!.userId }
    });

    if (!document) {
      return sendNotFound(res, 'Document');
    }

    // Validate status
    const validStatuses = ['draft', 'pending_signature', 'signed', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return sendError(res, 'Invalid status');
    }

    // Update document
    const updateData: any = {};
    if (status) {
      updateData.status = status;

      // If requesting signature, set timestamp
      if (status === 'pending_signature') {
        updateData.requestedSignatureAt = new Date();
      }

      // If signing, set signed data
      if (status === 'signed') {
        updateData.signedBy = req.user!.userId;
        updateData.signedAt = new Date();
        if (signatureMethod) {
          updateData.signatureMethod = signatureMethod;
        }
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await document.update(updateData);

    return sendSuccess(res, document, 'Document status updated successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to update document status');
  }
});

// POST /documents/:id/request-signature - Request tenant signature
router.post('/:id/request-signature', async (req: AuthRequest, res: Response) => {
  try {
    const { Document, Tenant, User } = require('../database/models');

    // Find document
    const document = await Document.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    if (!document) {
      return sendNotFound(res, 'Document');
    }

    // Only lease agreements can request signature
    if (document.documentType !== 'lease_agreement') {
      return sendError(res, 'Only lease agreements can request signatures');
    }

    // Update document status
    await document.update({
      status: 'pending_signature',
      requestedSignatureAt: new Date()
    });

    // TODO: Send email/SMS notification to tenant
    // This would integrate with your notification service

    return sendSuccess(res, document, 'Signature request sent to tenant');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to request signature');
  }
});

// POST /documents/:id/sign - Tenant signs document
router.post('/:id/sign', async (req: AuthRequest, res: Response) => {
  try {
    const { Document, Tenant } = require('../database/models');
    const { signatureMethod, signedDocument } = req.body;

    // Find document that the tenant has access to
    const tenant = await Tenant.findOne({
      where: { userId: req.user!.userId }
    });

    if (!tenant) {
      return sendError(res, 'You must be a tenant to sign documents');
    }

    const document = await Document.findOne({
      where: {
        id: req.params.id,
        entityType: 'tenant',
        entityId: tenant.id
      }
    });

    if (!document) {
      return sendNotFound(res, 'Document');
    }

    if (document.status === 'signed') {
      return sendError(res, 'Document is already signed');
    }

    // Update document
    await document.update({
      status: 'signed',
      signedBy: req.user!.userId,
      signedAt: new Date(),
      signatureMethod: signatureMethod || 'typed'
    });

    return sendSuccess(res, document, 'Document signed successfully');
  } catch (error) {
    return sendServerError(res, error as Error, 'Failed to sign document');
  }
});

export default router;
