import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string()
    .min(2, 'Property name must be at least 2 characters')
    .max(100, 'Property name must be less than 100 characters'),

  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must be less than 255 characters'),

  city: z.string()
    .min(1, 'Please select a city'),

  district: z.string().optional(),

  sector: z.string().optional(),

  type: z.enum(['apartment', 'house', 'commercial', 'land', 'other'], {
    errorMap: () => ({ message: 'Please select a property type' })
  }),

  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const unitSchema = z.object({
  unitNumber: z.string()
    .min(1, 'Unit number is required')
    .max(50, 'Unit number must be less than 50 characters'),

  floor: z.number()
    .int('Floor must be a whole number')
    .min(-5, 'Floor must be between -5 and 200')
    .max(200, 'Floor must be between -5 and 200')
    .optional()
    .nullable(),

  bedrooms: z.number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative')
    .max(20, 'Bedrooms must be less than 20')
    .optional()
    .nullable(),

  bathrooms: z.number()
    .int('Bathrooms must be a whole number')
    .min(0, 'Bathrooms cannot be negative')
    .max(20, 'Bathrooms must be less than 20')
    .optional()
    .nullable(),

  size: z.number()
    .positive('Size must be a positive number')
    .optional()
    .nullable(),

  monthlyRent: z.number()
    .positive('Rent amount must be greater than 0')
    .min(1, 'Rent amount must be at least 1'),

  status: z.enum(['vacant', 'occupied', 'maintenance'], {
    errorMap: () => ({ message: 'Please select a status' })
  }).optional(),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

export type UnitFormData = z.infer<typeof unitSchema>;
