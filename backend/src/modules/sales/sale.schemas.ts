import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';

export const saleCreateSchema = z.object({
  body: z.object({
    customerName: z.string().max(180).optional(),
    customerPhone: z.string().max(32).optional(),
    discountAmount: z.coerce.number().min(0).default(0),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().positive(),
          unitPrice: z.coerce.number().min(0).optional(),
          discountAmount: z.coerce.number().min(0).default(0),
        }),
      )
      .min(1),
  }),
});

export const saleListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
