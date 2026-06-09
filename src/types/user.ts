import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'sales' | 'stock_manager';

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  profileImage: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type SerializableUserProfile = Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  sales: 'Sales',
  stock_manager: 'Stock Manager',
};

export const roleDescriptions: Record<UserRole, string> = {
  admin: 'Controls all app work, users, roles, products, stock, and profile settings.',
  sales: 'Browses products and handles sales work without product creation access.',
  stock_manager: 'Manages products, inventory, and stock movement.',
};
