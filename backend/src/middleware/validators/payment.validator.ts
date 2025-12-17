import { body } from 'express-validator';
import {
  positiveNumberValidation,
  textAreaValidation,
  uuidParamValidation
} from './common.validator';

/**
 * Validation rules for payment creation
 */
export const createPaymentValidation = [
  body('tenantId')
    .notEmpty()
    .withMessage('Tenant ID is required')
    .isUUID()
    .withMessage('Tenant ID must be a valid UUID'),
  positiveNumberValidation('amount'),
  body('periodMonth')
    .notEmpty()
    .withMessage('Period month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Period month must be between 1 and 12'),
  body('periodYear')
    .notEmpty()
    .withMessage('Period year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Period year must be between 2000 and 2100'),
  body('paymentDate')
    .notEmpty()
    .withMessage('Payment date is required')
    .isISO8601()
    .withMessage('Payment date must be a valid date'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'bank_transfer', 'mobile_money', 'check', 'other'])
    .withMessage('Payment method must be cash, bank_transfer, mobile_money, check, or other'),
  body('transactionReference')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Transaction reference must be less than 255 characters'),
  textAreaValidation('notes', 500, false)
];

/**
 * Validation rules for payment update
 */
export const updatePaymentValidation = [
  uuidParamValidation('id'),
  positiveNumberValidation('amount', false),
  body('periodMonth')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Period month must be between 1 and 12'),
  body('periodYear')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Period year must be between 2000 and 2100'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Payment date must be a valid date'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'mobile_money', 'check', 'other'])
    .withMessage('Payment method must be cash, bank_transfer, mobile_money, check, or other'),
  body('transactionReference')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Transaction reference must be less than 255 characters'),
  textAreaValidation('notes', 500, false)
];
