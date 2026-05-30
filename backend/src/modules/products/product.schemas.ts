import { z } from 'zod';

const money = z.coerce.number().min(0);

export const productCreateSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    supplierId: z.string().uuid().optional(),
    name: z.string().min(2).max(180),
    sku: z.string().min(2).max(80),
    barcode: z.string().max(120).optional(),
    brand: z.string().max(120).optional(),
    modelNumber: z.string().max(120).optional(),
    description: z.string().optional(),
    costPrice: money.default(0),
    sellingPrice: money,
    quantityOnHand: z.coerce.number().int().min(0).default(0),
    lowStockThreshold: z.coerce.number().int().min(0).default(5),
  }),
});

export const productUpdateSchema = productCreateSchema.deepPartial().extend({
  params: z.object({ id: z.string().uuid() }),
});

export const productListSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    lowStock: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
