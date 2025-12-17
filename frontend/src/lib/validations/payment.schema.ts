import { z } from 'zod';

export const paymentSchema = z.object({
  tenantId: z.string()
    .uuid('Please select a valid tenant'),

  amount: z.number()
    .positive('Amount must be greater than 0')
    .min(1, 'Amount must be at least 1'),

  periodMonth: z.number()
    .int('Month must be a whole number')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),

  periodYear: z.number()
    .int('Year must be a whole number')
    .min(2000, 'Year must be between 2000 and 2100')
    .max(2100, 'Year must be between 2000 and 2100'),

  paymentDate: z.string()
    .min(1, 'Payment date is required'),

  paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_money', 'check', 'other'], {
    errorMap: () => ({ message: 'Please select a payment method' })
  }),

  transactionReference: z.string()
    .max(255, 'Transaction reference must be less than 255 characters')
    .optional()
    .or(z.literal('')),

  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
