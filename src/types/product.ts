import type { Timestamp } from 'firebase/firestore';

export type ProductStatus = 'active' | 'archived';

export type ProductCategory = {
  id: string;
  name: string;
  accent: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  categoryAccent: string;
  barcode: string;
  costPrice: number;
  price: number;
  stock: number;
  description: string | null;
  ownerId: string;
  ownerName: string;
  isActive: boolean;
  status: ProductStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export const categoryAccentOptions = [
  '#1d7cff',
  '#263241',
  '#8d99a8',
  '#151b26',
  '#059447',
  '#f97316',
  '#7c3aed',
  '#d92d20',
];

export function getProductProfit(product: Product) {
  return product.price - product.costPrice;
}

export function formatProductPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}
