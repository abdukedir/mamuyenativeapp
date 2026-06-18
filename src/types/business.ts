import type { Timestamp } from 'firebase/firestore';
import type { UserRole } from './user';

export type CreditStatus = 'paid' | 'partially_paid' | 'unpaid';

export type Credit = {
  id: string;
  customerName: string;
  phone: string;
  productPurchased: string;
  quantity: number;
  amount: number;
  paidAmount: number;
  remainingBalance: number;
  dueDate: string;
  status: CreditStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  productsSupplied: string[];
  outstandingBalance: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  totalPurchases: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Purchase = {
  id: string;
  supplierId: string | null;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  createdBy: string;
  createdAt: Timestamp;
};

export type AppSettings = {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  notificationSoundName: string;
  clearNotificationsAfterViewing: boolean;
  minimumStockLevel: number;
  criticalStockLevel: number;
  dailyReminder: boolean;
  pinLock: boolean;
  biometricAuth: boolean;
  updatedAt: Timestamp;
};

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  productId?: string;
  read: boolean;
  createdAt: Timestamp;
};

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'product_creation'
  | 'product_update'
  | 'product_deletion'
  | 'sales_creation'
  | 'purchase_creation'
  | 'expense_entry'
  | 'credit_registration'
  | 'payment_update'
  | 'supplier_update'
  | 'settings_update';

export type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: ActivityAction;
  deviceInfo: string;
  createdAt: Timestamp;
};
