import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member' | 'manager' | 'salesperson';
export type StoredUserRole = UserRole | 'membe';

export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  usernameLower: string;
  fullName: string;
  phone: string | null;
  role: StoredUserRole;
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

export const roleLabels: Record<StoredUserRole, string> = {
  admin: 'Admin',
  membe: 'Member',
  member: 'Member',
  manager: 'Manager',
  salesperson: 'Salesperson',
};

export const roleDescriptions: Record<StoredUserRole, string> = {
  admin: 'Controls all app work, users, roles, products, stock, and profile settings.',
  membe: 'Controls all app work, users, roles, products, stock, and profile settings.',
  member: 'Controls all app work, users, roles, products, stock, and profile settings.',
  manager: 'Manages products, purchases, stock, expenses, suppliers, and reports.',
  salesperson: 'Handles sales, customers, credits, and checkout work.',
};

function normalizeStoredRole(role: unknown) {
  return typeof role === 'string' ? role.trim().toLowerCase() : '';
}

export function canAccessAllApp(userProfile: UserProfile | null | undefined) {
  return Boolean(userProfile) && userProfile?.isActive !== false;
}

export function hasMemberAccess(userProfile: UserProfile | null | undefined) {
  return canAccessAllApp(userProfile) && ['member', 'admin', 'membe'].includes(normalizeStoredRole(userProfile?.role));
}

export function isSalesperson(userProfile: UserProfile | null | undefined) {
  return canAccessAllApp(userProfile) && normalizeStoredRole(userProfile?.role) === 'salesperson';
}

export function isAdminLikeUser(userProfile: UserProfile | null | undefined) {
  return canAccessAllApp(userProfile);
}
