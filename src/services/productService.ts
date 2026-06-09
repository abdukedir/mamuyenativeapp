import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';

import { firestore } from '@/config/firebase';
import type { Product } from '@/types/product';
import type { ProductCategory } from '@/types/product';
import type { UserProfile } from '@/types/user';
import type { ProductFormValues } from '@/validations/productSchemas';

const productsCollection = 'products';
const productsRef = collection(firestore, productsCollection);
const salesRef = collection(firestore, 'sales');

function productRef(productId: string) {
  return doc(firestore, productsCollection, productId);
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function subscribeToProducts(
  onProducts: (products: Product[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(productsRef, orderBy('createdAt', 'desc')),
    (snapshot) => {
      onProducts(
        snapshot.docs.map((document) => ({
          ...(document.data() as Omit<Product, 'id'>),
          id: document.id,
        }))
      );
    },
    onError
  );
}

export async function createProductWithCategory(
  values: ProductFormValues,
  category: ProductCategory,
  owner: UserProfile
) {
  const now = serverTimestamp() as Timestamp;

  const product: Omit<Product, 'id'> = {
    name: cleanText(values.name),
    sku: cleanText(values.sku).toUpperCase(),
    categoryId: category.id,
    categoryName: category.name,
    categoryAccent: category.accent,
    barcode: cleanText(values.barcode),
    costPrice: Number(values.costPrice),
    price: Number(values.price),
    stock: Number(values.stock),
    description: values.description ? cleanText(values.description) : null,
    ownerId: owner.uid,
    ownerName: owner.fullName,
    isActive: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await addDoc(productsRef, product);
}

export async function updateProductStock(product: Product, nextStock: number) {
  await updateDoc(productRef(product.id), {
    stock: nextStock,
    updatedAt: serverTimestamp(),
  });
}

export async function sellProduct(product: Product, user: UserProfile, quantity = 1) {
  if (product.stock < quantity) {
    throw new Error('This product is out of stock.');
  }

  const saleQuantity = Number(quantity);
  const totalRevenue = product.price * saleQuantity;
  const totalCost = product.costPrice * saleQuantity;
  const batch = writeBatch(firestore);
  const saleRef = doc(salesRef);

  batch.update(productRef(product.id), {
    stock: product.stock - saleQuantity,
    updatedAt: serverTimestamp(),
  });
  batch.set(saleRef, {
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
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function checkoutProducts(
  items: Array<{ product: Product; quantity: number }>,
  user: UserProfile
) {
  const batch = writeBatch(firestore);

  for (const item of items) {
    if (item.product.stock < item.quantity) {
      throw new Error(`${item.product.name} does not have enough stock.`);
    }

    const totalRevenue = item.product.price * item.quantity;
    const totalCost = item.product.costPrice * item.quantity;
    const saleRef = doc(salesRef);

    batch.update(productRef(item.product.id), {
      stock: item.product.stock - item.quantity,
      updatedAt: serverTimestamp(),
    });
    batch.set(saleRef, {
      productId: item.product.id,
      productName: item.product.name,
      barcode: item.product.barcode,
      quantity: item.quantity,
      unitPrice: item.product.price,
      unitCost: item.product.costPrice,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      createdBy: user.uid,
      createdByName: user.fullName,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
