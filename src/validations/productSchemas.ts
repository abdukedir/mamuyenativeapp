import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(60, 'Category name must be 60 characters or fewer'),
  accent: z.string().min(1, 'Choose a category color'),
});

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(120, 'Product name must be 120 characters or fewer'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'SKU must be at least 2 characters')
    .max(40, 'SKU must be 40 characters or fewer')
    .regex(/^[A-Z0-9-]+$/, 'Use letters, numbers, and dashes only'),
  categoryId: z.string().min(1, 'Create and choose a category first'),
  barcode: z
    .string()
    .trim()
    .min(3, 'Scan or enter a barcode')
    .max(120, 'Barcode is too long'),
  costPrice: z.coerce
    .number({ error: 'Enter a valid cost price' })
    .min(0, 'Cost price cannot be negative')
    .max(999999, 'Cost price is too high'),
  price: z.coerce
    .number({ error: 'Enter a valid price' })
    .min(0.01, 'Price must be greater than zero')
    .max(999999, 'Price is too high'),
  stock: z.coerce
    .number({ error: 'Enter a valid stock quantity' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock is too high'),
  minimumStockLevel: z.coerce
    .number({ error: 'Enter a minimum stock level' })
    .int('Minimum stock level must be a whole number')
    .min(0, 'Minimum stock cannot be negative')
    .max(999999, 'Minimum stock is too high'),
  criticalStockLevel: z.coerce
    .number({ error: 'Enter a critical stock level' })
    .int('Critical stock level must be a whole number')
    .min(0, 'Critical stock cannot be negative')
    .max(999999, 'Critical stock is too high'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer').optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;
