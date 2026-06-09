import type { Timestamp } from 'firebase/firestore';

export type ExpenseStatus = 'approved';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  note: string | null;
  status: ExpenseStatus;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
};
