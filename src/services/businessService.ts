import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '@/config/firebase';
import type {
  ActivityAction,
  ActivityLog,
  AppSettings,
  Credit,
  Customer,
  NotificationRecord,
  Purchase,
  Supplier,
} from '@/types/business';
import type { UserProfile } from '@/types/user';
import { showLocalNotification } from './notificationService';

export const defaultSettings: Omit<AppSettings, 'updatedAt'> = {
  currency: 'USD',
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  notificationSound: true,
  notificationSoundName: 'default',
  clearNotificationsAfterViewing: true,
  minimumStockLevel: 5,
  criticalStockLevel: 2,
  dailyReminder: false,
  pinLock: false,
  biometricAuth: false,
};

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function subscribeCollection<T>(
  collectionName: string,
  onItems: (items: T[]) => void,
  onError: (error: Error) => void,
  take = 50
) {
  return onSnapshot(
    query(collection(firestore, collectionName), orderBy('createdAt', 'desc'), limit(take)),
    (snapshot) => {
      onItems(snapshot.docs.map((item) => ({ ...(item.data() as Omit<T, 'id'>), id: item.id }) as T));
    },
    onError
  );
}

export const subscribeToCredits = (
  onItems: (items: Credit[]) => void,
  onError: (error: Error) => void
) => subscribeCollection<Credit>('credits', onItems, onError);

export const subscribeToSuppliers = (
  onItems: (items: Supplier[]) => void,
  onError: (error: Error) => void
) => subscribeCollection<Supplier>('suppliers', onItems, onError);

export const subscribeToCustomers = (
  onItems: (items: Customer[]) => void,
  onError: (error: Error) => void
) => subscribeCollection<Customer>('customers', onItems, onError);

export const subscribeToPurchases = (
  onItems: (items: Purchase[]) => void,
  onError: (error: Error) => void
) => subscribeCollection<Purchase>('purchases', onItems, onError);

export const subscribeToNotifications = (
  onItems: (items: NotificationRecord[]) => void,
  onError: (error: Error) => void
) => subscribeCollection<NotificationRecord>('notifications', onItems, onError);

export const subscribeToActivityLogs = (
  onItems: (items: ActivityLog[]) => void,
  onError: (error: Error) => void
) => subscribeCollection<ActivityLog>('activityLogs', onItems, onError, 100);

export async function addCustomer(
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>,
  user: UserProfile
) {
  await addDoc(collection(firestore, 'customers'), {
    ...input,
    name: cleanText(input.name),
    phone: cleanText(input.phone),
    totalPurchases: Number(input.totalPurchases) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await safeLogActivity(user, 'payment_update');
}

export async function addPurchase(
  input: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'outstandingBalance'>,
  user: UserProfile
) {
  const outstandingBalance = Math.max(0, Number(input.totalAmount) - Number(input.paidAmount));

  await addDoc(collection(firestore, 'purchases'), {
    ...input,
    supplierName: cleanText(input.supplierName),
    totalAmount: Number(input.totalAmount) || 0,
    paidAmount: Number(input.paidAmount) || 0,
    outstandingBalance,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  await safeLogActivity(user, 'purchase_creation');
}

export async function addCredit(
  input: Omit<Credit, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'remainingBalance' | 'status'>,
  user: UserProfile
) {
  const remainingBalance = Math.max(0, Number(input.amount) - Number(input.paidAmount));
  const status = remainingBalance === 0 ? 'paid' : input.paidAmount > 0 ? 'partially_paid' : 'unpaid';

  await addDoc(collection(firestore, 'credits'), {
    ...input,
    customerName: cleanText(input.customerName),
    phone: cleanText(input.phone),
    productPurchased: cleanText(input.productPurchased),
    remainingBalance,
    status,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await safeLogActivity(user, 'credit_registration');
}

export async function addSupplier(
  input: Omit<Supplier, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
  user: UserProfile
) {
  await addDoc(collection(firestore, 'suppliers'), {
    ...input,
    name: cleanText(input.name),
    phone: cleanText(input.phone),
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await safeLogActivity(user, 'supplier_update');
}

export async function updateSupplier(id: string, updates: Partial<Supplier>, user: UserProfile) {
  await updateDoc(doc(firestore, 'suppliers', id), { ...updates, updatedAt: serverTimestamp() });
  await safeLogActivity(user, 'supplier_update');
}

export async function deleteSupplier(id: string, user: UserProfile) {
  await deleteDoc(doc(firestore, 'suppliers', id));
  await safeLogActivity(user, 'supplier_update');
}

export function subscribeToSettings(onSettings: (settings: AppSettings) => void, onError: (error: Error) => void) {
  return onSnapshot(
    doc(firestore, 'settings', 'global'),
    (snapshot) => {
      onSettings({
        ...defaultSettings,
        ...(snapshot.data() as Partial<AppSettings> | undefined),
        updatedAt: (snapshot.data()?.updatedAt ?? serverTimestamp()) as Timestamp,
      });
    },
    onError
  );
}

export async function updateSettings(updates: Partial<AppSettings>, user: UserProfile) {
  await setDoc(
    doc(firestore, 'settings', 'global'),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await safeLogActivity(user, 'settings_update');
}

export async function clearViewedNotifications() {
  const unsubscribePromise = new Promise<void>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(50)),
      async (snapshot) => {
        unsubscribe();
        try {
          await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });

  await unsubscribePromise;
}

export async function logActivity(user: UserProfile, action: ActivityAction) {
  await addDoc(collection(firestore, 'activityLogs'), {
    userId: user.uid,
    userName: user.fullName,
    role: user.role,
    action,
    deviceInfo: 'Expo React Native',
    createdAt: serverTimestamp(),
  });

  if (user.role === 'salesperson') {
    await addAdminNotification(
      'Salesperson activity',
      `${user.fullName} completed ${action.replace(/_/g, ' ')}.`
    );
  }
}

export async function addAdminNotification(title: string, body: string, productId?: string) {
  await addDoc(collection(firestore, 'notifications'), {
    title,
    body,
    productId: productId ?? null,
    read: false,
    audience: 'admin',
    createdAt: serverTimestamp(),
  });
  await showLocalNotification(title, body);
}

export async function requestFirestoreBackup() {
  const callable = httpsCallable<undefined, { id: string; status: string }>(
    firebaseFunctions,
    'requestFirestoreBackup'
  );

  return callable(undefined);
}

export async function requestFirestoreRestore() {
  const callable = httpsCallable<undefined, { id: string; status: string }>(
    firebaseFunctions,
    'requestFirestoreRestore'
  );

  return callable(undefined);
}

export async function safeLogActivity(user: UserProfile | null | undefined, action: ActivityAction) {
  if (!user) {
    return;
  }

  await logActivity(user, action).catch(() => undefined);
}
