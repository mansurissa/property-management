import { body } from 'express-validator';
import {
  nameValidation,
  phoneValidation,
  emailValidation,
  positiveNumberValidation,
  dateValidation,
  uuidParamValidation
} from './common.validator';

/**
 * Validation rules for tenant creation
 */
export const createTenantValidation = [
  nameValidation('firstName'),
  nameValidation('lastName'),
  phoneValidation,
  emailValidation,
  body('nationalId')
    .optional()
    .trim()
    .isLength({ min: 16, max: 16 })
    .withMessage('National ID must be exactly 16 digits'),
  body('propertyId')
    .optional()
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  body('unitId')
    .optional()
    .isUUID()
    .withMessage('Unit ID must be a valid UUID'),
  positiveNumberValidation('rentAmount', false),
  dateValidation('leaseStartDate', false),
  dateValidation('leaseEndDate', false),
  body('leaseEndDate')
    .optional()
    .custom((value, { req }) => {
      if (req.body.leaseStartDate && value) {
        const startDate = new Date(req.body.leaseStartDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('Lease end date must be after start date');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  body('paymentDay')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Payment day must be between 1 and 31')
];

/**
 * Validation rules for tenant update
 */
export const updateTenantValidation = [
  uuidParamValidation('id'),
  nameValidation('firstName', false),
  nameValidation('lastName', false),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+?250|0)?7[2-9]\d{7}$/)
    .withMessage('Phone number must be a valid Rwandan phone number'),
  emailValidation,
  body('nationalId')
    .optional()
    .trim()
    .isLength({ min: 16, max: 16 })
    .withMessage('National ID must be exactly 16 digits'),
  positiveNumberValidation('rentAmount', false),
  dateValidation('leaseStartDate', false),
  dateValidation('leaseEndDate', false),
  body('leaseEndDate')
    .optional()
    .custom((value, { req }) => {
      if (req.body.leaseStartDate && value) {
        const startDate = new Date(req.body.leaseStartDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('Lease end date must be after start date');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  body('paymentDay')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Payment day must be between 1 and 31')
];

/**
 * Validation rules for assigning tenant to unit
 */
export const assignTenantToUnitValidation = [
  uuidParamValidation('id'),
  body('unitId')
    .notEmpty()
    .withMessage('Unit ID is required')
    .isUUID()
    .withMessage('Unit ID must be a valid UUID'),
  positiveNumberValidation('rentAmount', false),
  dateValidation('leaseStartDate', false),
  dateValidation('leaseEndDate', false),
  body('paymentDay')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Payment day must be between 1 and 31')
];
