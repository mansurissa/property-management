import { body } from 'express-validator';
import {
  nameValidation,
  textAreaValidation,
  uuidParamValidation
} from './common.validator';

/**
 * Validation rules for property creation
 */
export const createPropertyValidation = [
  nameValidation('name'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Address must be between 5 and 255 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must be less than 100 characters'),
  body('sector')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sector must be less than 100 characters'),
  body('type')
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['apartment', 'house', 'commercial', 'land', 'other'])
    .withMessage('Property type must be apartment, house, commercial, land, or other'),
  textAreaValidation('description', 1000, false)
];

/**
 * Validation rules for property update
 */
export const updatePropertyValidation = [
  uuidParamValidation('id'),
  nameValidation('name', false),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address must be between 5 and 255 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must be less than 100 characters'),
  body('sector')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sector must be less than 100 characters'),
  body('type')
    .optional()
    .isIn(['apartment', 'house', 'commercial', 'land', 'other'])
    .withMessage('Property type must be apartment, house, commercial, land, or other'),
  textAreaValidation('description', 1000, false)
];

/**
 * Validation rules for unit creation
 */
export const createUnitValidation = [
  uuidParamValidation('propertyId'),
  body('unitNumber')
    .trim()
    .notEmpty()
    .withMessage('Unit number is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit number must be between 1 and 50 characters'),
  body('floor')
    .optional()
    .isInt({ min: -5, max: 200 })
    .withMessage('Floor must be between -5 and 200'),
  body('bedrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bedrooms must be between 0 and 20'),
  body('bathrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bathrooms must be between 0 and 20'),
  body('size')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Size must be a positive number'),
  body('rentAmount')
    .notEmpty()
    .withMessage('Rent amount is required')
    .isFloat({ min: 0 })
    .withMessage('Rent amount must be a positive number'),
  body('status')
    .optional()
    .isIn(['vacant', 'occupied', 'maintenance'])
    .withMessage('Status must be vacant, occupied, or maintenance'),
  textAreaValidation('description', 500, false)
];

/**
 * Validation rules for unit update
 */
export const updateUnitValidation = [
  uuidParamValidation('propertyId'),
  uuidParamValidation('unitId'),
  body('unitNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit number must be between 1 and 50 characters'),
  body('floor')
    .optional()
    .isInt({ min: -5, max: 200 })
    .withMessage('Floor must be between -5 and 200'),
  body('bedrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bedrooms must be between 0 and 20'),
  body('bathrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bathrooms must be between 0 and 20'),
  body('size')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Size must be a positive number'),
  body('rentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rent amount must be a positive number'),
  body('status')
    .optional()
    .isIn(['vacant', 'occupied', 'maintenance'])
    .withMessage('Status must be vacant, occupied, or maintenance'),
  textAreaValidation('description', 500, false)
];
