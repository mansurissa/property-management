import { z } from 'zod';

// Rwandan phone number regex: (250|0)?7[2-9]\d{7}
const phoneRegex = /^(\+?250|0)?7[2-9]\d{7}$/;

export const tenantSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be less than 100 characters'),

  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be less than 100 characters'),

  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid Rwandan phone number (e.g., 0781234567 or +250781234567)'),

  nationalId: z.string()
    .length(16, 'National ID must be exactly 16 digits')
    .regex(/^\d+$/, 'National ID must contain only numbers')
    .optional()
    .or(z.literal('')),

  emergencyContact: z.string()
    .min(2, 'Emergency contact name must be at least 2 characters')
    .max(100, 'Emergency contact name must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  emergencyPhone: z.string()
    .regex(phoneRegex, 'Please enter a valid Rwandan phone number')
    .optional()
    .or(z.literal('')),

  unitId: z.string()
    .uuid('Please select a valid unit')
    .optional()
    .or(z.literal('')),

  propertyId: z.string()
    .uuid('Please select a valid property')
    .optional()
    .or(z.literal('')),

  leaseStartDate: z.string()
    .optional()
    .or(z.literal('')),

  leaseEndDate: z.string()
    .optional()
    .or(z.literal('')),

  rentAmount: z.number()
    .positive('Rent amount must be greater than 0')
    .optional()
    .nullable(),

  paymentDay: z.number()
    .int('Payment day must be a whole number')
    .min(1, 'Payment day must be between 1 and 31')
    .max(31, 'Payment day must be between 1 and 31')
    .optional()
    .nullable(),

  status: z.enum(['active', 'inactive', 'pending']).optional()
}).refine((data) => {
  // If leaseEndDate is provided, it must be after leaseStartDate
  if (data.leaseStartDate && data.leaseEndDate) {
    return new Date(data.leaseEndDate) > new Date(data.leaseStartDate);
  }
  return true;
}, {
  message: 'Lease end date must be after lease start date',
  path: ['leaseEndDate']
});

export type TenantFormData = z.infer<typeof tenantSchema>;
