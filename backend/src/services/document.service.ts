/**
 * Document Management Service
 * Upload and store lease agreements, ID copies, and other documents
 * Supports Cloudinary and local storage
 */

import crypto from 'crypto';

// Generate UUID using crypto instead of uuid package
const generateUUID = () => crypto.randomUUID();
import path from 'path';
import fs from 'fs';

const db = require('../database/models');
const { Document, Tenant, Property, Unit } = db;

export interface DocumentUploadResult {
  success: boolean;
  document?: {
    id: string;
    name: string;
    type: string;
    url: string;
    publicId: string;
    size: number;
  };
  error?: string;
}

export interface DocumentListResult {
  success: boolean;
  documents: any[];
  total: number;
}

export type DocumentType =
  | 'lease_agreement'
  | 'id_copy'
  | 'proof_of_income'
  | 'reference_letter'
  | 'property_deed'
  | 'insurance'
  | 'inspection_report'
  | 'receipt'
  | 'other';

export type DocumentEntityType = 'tenant' | 'property' | 'unit' | 'payment';

// Document type configurations
const DOCUMENT_CONFIG: Record<DocumentType, { maxSize: number; allowedTypes: string[] }> = {
  lease_agreement: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  id_copy: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  proof_of_income: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  reference_letter: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  property_deed: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  insurance: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  inspection_report: {
    maxSize: 20 * 1024 * 1024, // 20MB for reports with photos
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  receipt: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  },
  other: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
};

// Validate document before upload
export const validateDocument = (
  file: Express.Multer.File,
  documentType: DocumentType
): { valid: boolean; error?: string } => {
  const config = DOCUMENT_CONFIG[documentType] || DOCUMENT_CONFIG.other;

  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${config.maxSize / (1024 * 1024)}MB)`
    };
  }

  if (!config.allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
};

// Upload document to Cloudinary
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> => {
  try {
    const cloudinary = require('cloudinary').v2;

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Determine resource type
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `renta/documents/${folder}`,
          resource_type: resourceType,
          public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);

    // Fallback to local storage
    return uploadToLocal(file, folder);
  }
};

// Upload document to local storage (fallback)
export const uploadToLocal = async (
  file: Express.Multer.File,
  folder: string
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> => {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', folder);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${generateUUID()}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    fs.writeFileSync(filepath, file.buffer);

    const publicId = `local_${folder}_${filename}`;
    const url = `/uploads/documents/${folder}/${filename}`;

    return {
      success: true,
      url,
      publicId
    };
  } catch (error) {
    console.error('Local upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
};

// Delete document from storage
export const deleteFromStorage = async (publicId: string): Promise<boolean> => {
  try {
    if (publicId.startsWith('local_')) {
      // Local file
      const parts = publicId.replace('local_', '').split('_');
      const folder = parts[0];
      const filename = parts.slice(1).join('_');
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'documents', folder, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      return true;
    } else {
      // Cloudinary
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      await cloudinary.uploader.destroy(publicId);
      return true;
    }
  } catch (error) {
    console.error('Delete from storage error:', error);
    return false;
  }
};

// Upload and save document record
export const uploadDocument = async (
  file: Express.Multer.File,
  data: {
    userId: string;
    entityType: DocumentEntityType;
    entityId: string;
    documentType: DocumentType;
    description?: string;
  }
): Promise<DocumentUploadResult> => {
  // Validate file
  const validation = validateDocument(file, data.documentType);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Determine folder based on entity type
  const folder = `${data.entityType}s/${data.entityId}`;

  // Upload file
  const uploadResult = await uploadToCloudinary(file, folder);
  if (!uploadResult.success) {
    return { success: false, error: uploadResult.error };
  }

  try {
    // Create document record
    const document = await Document.create({
      userId: data.userId,
      entityType: data.entityType,
      entityId: data.entityId,
      documentType: data.documentType,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      description: data.description
    });

    return {
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.documentType,
        url: document.url,
        publicId: document.publicId,
        size: document.size
      }
    };
  } catch (error) {
    // Cleanup uploaded file on error
    if (uploadResult.publicId) {
      await deleteFromStorage(uploadResult.publicId);
    }

    console.error('Document record creation error:', error);
    return {
      success: false,
      error: 'Failed to save document record'
    };
  }
};

// Get documents for an entity
export const getDocuments = async (
  entityType: DocumentEntityType,
  entityId: string,
  userId: string
): Promise<DocumentListResult> => {
  try {
    const documents = await Document.findAll({
      where: {
        entityType,
        entityId,
        userId
      },
      order: [['createdAt', 'DESC']]
    });

    return {
      success: true,
      documents,
      total: documents.length
    };
  } catch (error) {
    console.error('Get documents error:', error);
    return {
      success: false,
      documents: [],
      total: 0
    };
  }
};

// Get document by ID
export const getDocumentById = async (
  documentId: string,
  userId: string
): Promise<any | null> => {
  try {
    const document = await Document.findOne({
      where: {
        id: documentId,
        userId
      }
    });

    return document;
  } catch (error) {
    console.error('Get document error:', error);
    return null;
  }
};

// Delete document
export const deleteDocument = async (
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const document = await Document.findOne({
      where: {
        id: documentId,
        userId
      }
    });

    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // Delete from storage
    await deleteFromStorage(document.publicId);

    // Delete record
    await document.destroy();

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: 'Failed to delete document'
    };
  }
};

// Get all documents for a user (across all entities)
export const getAllUserDocuments = async (
  userId: string,
  filters?: {
    entityType?: DocumentEntityType;
    documentType?: DocumentType;
  }
): Promise<DocumentListResult> => {
  try {
    const whereClause: any = { userId };

    if (filters?.entityType) {
      whereClause.entityType = filters.entityType;
    }
    if (filters?.documentType) {
      whereClause.documentType = filters.documentType;
    }

    const documents = await Document.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Tenant,
          as: 'tenant',
          required: false,
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Property,
          as: 'property',
          required: false,
          attributes: ['id', 'name']
        },
        {
          model: Unit,
          as: 'unit',
          required: false,
          attributes: ['id', 'unitNumber']
        }
      ]
    });

    return {
      success: true,
      documents,
      total: documents.length
    };
  } catch (error) {
    console.error('Get all user documents error:', error);
    return {
      success: false,
      documents: [],
      total: 0
    };
  }
};

export default {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  getAllUserDocuments,
  validateDocument,
  deleteFromStorage
};
