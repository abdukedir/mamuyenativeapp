import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';

import { firestore } from '@/config/firebase';
import type { Expense, Sale } from '@/types/activity';
import type { Product } from '@/types/product';
import type { UserProfile } from '@/types/user';

const expensesRef = collection(firestore, 'expenses');
const salesRef = collection(firestore, 'sales');

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function subscribeToExpenses(
  onExpenses: (expenses: Expense[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(expensesRef, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onExpenses(
        snapshot.docs.map((document) => ({
          ...(document.data() as Omit<Expense, 'id'>),
          id: document.id,
        }))
      );
    },
    onError
  );
}

export function subscribeToSales(onSales: (sales: Sale[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    query(salesRef, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onSales(
        snapshot.docs.map((document) => ({
          ...(document.data() as Omit<Sale, 'id'>),
          id: document.id,
        }))
      );
    },
    onError
  );
}

export async function createExpense(input: { title: string; amount: number; note?: string }, user: UserProfile) {
  const expense: Omit<Expense, 'id'> = {
    title: cleanText(input.title),
    amount: Number(input.amount),
    note: input.note ? cleanText(input.note) : null,
    status: 'approved',
    createdBy: user.uid,
    createdByName: user.fullName,
    createdAt: serverTimestamp() as Timestamp,
  };

  await addDoc(expensesRef, expense);
}

export async function createSale(product: Product, quantity: number, user: UserProfile) {
  const saleQuantity = Number(quantity);
  const totalRevenue = product.price * saleQuantity;
  const totalCost = product.costPrice * saleQuantity;

  const sale: Omit<Sale, 'id'> = {
    productId: product.id,
    productName: product.name,
    barcode: product.barcode,
    quantity: saleQuantity,
    unitPrice: product.price,
    unitCost: product.costPrice,
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost,
    createdBy: user.uid,
    createdByName: user.fullName,
    createdAt: serverTimestamp() as Timestamp,
  };

  await addDoc(salesRef, sale);
}
