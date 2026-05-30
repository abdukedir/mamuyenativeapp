import { InventoryTransactionType } from '@prisma/client';
import { z } from 'zod';

export const inventoryMutationSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    transactionType: z.nativeEnum(InventoryTransactionType),
    quantity: z.coerce.number().int().positive(),
    unitCost: z.coerce.number().min(0).optional(),
    reference: z.string().max(120).optional(),
    reason: z.string().optional(),
    supplierId: z.string().uuid().optional(),
  }),
});

export const inventoryListSchema = z.object({
  query: z.object({
    productId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
