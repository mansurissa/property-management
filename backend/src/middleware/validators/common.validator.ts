import { body, param, query } from 'express-validator';

/**
 * Common validation rules reused across validators
 */

// Phone number validation (Rwandan format)
export const phoneValidation = body('phone')
  .trim()
  .matches(/^(\+?250|0)?7[2-9]\d{7}$/)
  .withMessage('Phone number must be a valid Rwandan phone number');

// Email validation
export const emailValidation = body('email')
  .optional()
  .trim()
  .isEmail()
  .withMessage('Must be a valid email address')
  .normalizeEmail();

// Required email validation
export const requiredEmailValidation = body('email')
  .trim()
  .isEmail()
  .withMessage('Must be a valid email address')
  .normalizeEmail();

// UUID parameter validation
export const uuidParamValidation = (paramName: string = 'id') =>
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`);

// Name validation
export const nameValidation = (fieldName: string, required: boolean = true) => {
  const validation = body(fieldName)
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(`${fieldName} must be between 2 and 100 characters`);

  if (!required) {
    return validation.optional();
  }

  return validation.notEmpty().withMessage(`${fieldName} is required`);
};

// Positive number validation
export const positiveNumberValidation = (fieldName: string, required: boolean = true) => {
  const validation = body(fieldName)
    .isFloat({ min: 0.01 })
    .withMessage(`${fieldName} must be a positive number`);

  if (!required) {
    return validation.optional();
  }

  return validation;
};

// Date validation
export const dateValidation = (fieldName: string, required: boolean = true) => {
  const validation = body(fieldName)
    .isISO8601()
    .withMessage(`${fieldName} must be a valid date`);

  if (!required) {
    return validation.optional();
  }

  return validation;
};

// Text area validation
export const textAreaValidation = (fieldName: string, maxLength: number = 500, required: boolean = false) => {
  const validation = body(fieldName)
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} must be less than ${maxLength} characters`);

  if (!required) {
    return validation.optional();
  }

  return validation.notEmpty().withMessage(`${fieldName} is required`);
};

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
