import { body } from 'express-validator';
import {
  textAreaValidation,
  uuidParamValidation
} from './common.validator';

/**
 * Validation rules for document upload
 */
export const uploadDocumentValidation = [
  body('entityType')
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(['tenant', 'property', 'unit', 'payment'])
    .withMessage('Entity type must be tenant, property, unit, or payment'),
  body('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .isUUID()
    .withMessage('Entity ID must be a valid UUID'),
  body('documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['lease_agreement', 'id_copy', 'proof_of_income', 'reference_letter', 'property_deed', 'insurance', 'inspection_report', 'receipt', 'other'])
    .withMessage('Invalid document type'),
  textAreaValidation('description', 500, false)
];

/**
 * Validation rules for document status update
 */
export const updateDocumentStatusValidation = [
  uuidParamValidation('id'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'pending_signature', 'signed', 'rejected'])
    .withMessage('Status must be draft, pending_signature, signed, or rejected'),
  body('signatureMethod')
    .optional()
    .isIn(['uploaded', 'physical', 'typed', 'none'])
    .withMessage('Signature method must be uploaded, physical, typed, or none'),
  textAreaValidation('notes', 500, false)
];

/**
 * Validation rules for document signing
 */
export const signDocumentValidation = [
  uuidParamValidation('id'),
  body('signatureMethod')
    .notEmpty()
    .withMessage('Signature method is required')
    .isIn(['uploaded', 'physical', 'typed'])
    .withMessage('Signature method must be uploaded, physical, or typed')
];
