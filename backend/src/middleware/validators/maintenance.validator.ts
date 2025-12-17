import { body } from 'express-validator';
import {
  textAreaValidation,
  uuidParamValidation,
  positiveNumberValidation
} from './common.validator';

/**
 * Validation rules for maintenance request creation
 */
export const createMaintenanceValidation = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required')
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  body('unitId')
    .optional()
    .isUUID()
    .withMessage('Unit ID must be a valid UUID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  textAreaValidation('description', 2000, true),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('category')
    .optional()
    .isIn(['plumbing', 'electrical', 'appliance', 'structural', 'cleaning', 'other'])
    .withMessage('Category must be plumbing, electrical, appliance, structural, cleaning, or other')
];

/**
 * Validation rules for maintenance request update
 */
export const updateMaintenanceValidation = [
  uuidParamValidation('id'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  textAreaValidation('description', 2000, false),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in_progress, completed, or cancelled'),
  body('category')
    .optional()
    .isIn(['plumbing', 'electrical', 'appliance', 'structural', 'cleaning', 'other'])
    .withMessage('Category must be plumbing, electrical, appliance, structural, cleaning, or other'),
  positiveNumberValidation('cost', false),
  body('completedAt')
    .optional()
    .isISO8601()
    .withMessage('Completed date must be a valid date'),
  textAreaValidation('resolution', 1000, false)
];

/**
 * Validation rules for assigning maintenance to staff
 */
export const assignMaintenanceValidation = [
  uuidParamValidation('id'),
  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isUUID()
    .withMessage('Staff ID must be a valid UUID')
];
