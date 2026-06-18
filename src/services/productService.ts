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
import type { Product, ProductCategory } from '@/types/product';
import type { UserProfile } from '@/types/user';
import type { ProductFormValues } from '@/validations/productSchemas';
import { addAdminNotification, safeLogActivity } from './businessService';

const productsCollection = 'products';
const productsRef = collection(firestore, productsCollection);
const salesRef = collection(firestore, 'sales');
const saleItemsRef = collection(firestore, 'saleItems');

function productRef(productId: string) {
  return doc(firestore, productsCollection, productId);
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

async function notifyStockLevel(product: Product, nextStock: number) {
  if (nextStock <= 0) {
    await addAdminNotification(
      'Out of inventory',
      `${product.name} is now out of stock.`,
      product.id
    ).catch(() => undefined);
    return;
  }

  if (nextStock <= product.minimumStockLevel) {
    await addAdminNotification(
      'Stock out alert',
      `${product.name} has ${nextStock} items left.`,
      product.id
    ).catch(() => undefined);
  }
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
    minimumStockLevel: Number(values.minimumStockLevel),
    criticalStockLevel: Number(values.criticalStockLevel),
    description: values.description ? cleanText(values.description) : null,
    ownerId: owner.uid,
    ownerName: owner.fullName,
    isActive: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const productDoc = await addDoc(productsRef, product);
  await notifyStockLevel({ ...product, id: productDoc.id }, product.stock);
  await safeLogActivity(owner, 'product_creation');
}

export async function updateProductDetails(
  product: Product,
  values: ProductFormValues,
  category: ProductCategory,
  user: UserProfile
) {
  await updateDoc(productRef(product.id), {
    name: cleanText(values.name),
    sku: cleanText(values.sku).toUpperCase(),
    categoryId: category.id,
    categoryName: category.name,
    categoryAccent: category.accent,
    barcode: cleanText(values.barcode),
    costPrice: Number(values.costPrice),
    price: Number(values.price),
    stock: Number(values.stock),
    minimumStockLevel: Number(values.minimumStockLevel),
    criticalStockLevel: Number(values.criticalStockLevel),
    description: values.description ? cleanText(values.description) : null,
    isActive: product.isActive,
    status: product.status,
    updatedAt: serverTimestamp(),
  });
  await safeLogActivity(user, 'product_update');
}

export async function updateProductStock(product: Product, nextStock: number, user?: UserProfile) {
  await updateDoc(productRef(product.id), {
    stock: nextStock,
    updatedAt: serverTimestamp(),
  });
  await notifyStockLevel(product, nextStock);
  if (user) {
    await safeLogActivity(user, 'product_update');
  }
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
  const saleItemRef = doc(saleItemsRef);
  const salePayload = {
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
  };

  batch.update(productRef(product.id), {
    stock: product.stock - saleQuantity,
    updatedAt: serverTimestamp(),
  });
  batch.set(saleRef, salePayload);
  batch.set(saleItemRef, { ...salePayload, saleId: saleRef.id });

  await batch.commit();
  await notifyStockLevel(product, product.stock - saleQuantity);
  await safeLogActivity(user, 'sales_creation');
}

export async function checkoutProducts(
  items: { product: Product; quantity: number }[],
  user: UserProfile,
  discountAmount = 0
) {
  const batch = writeBatch(firestore);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cleanDiscount = Math.min(Math.max(Number(discountAmount) || 0, 0), subtotal);
  let appliedDiscount = 0;

  for (const [index, item] of items.entries()) {
    if (item.product.stock < item.quantity) {
      throw new Error(`${item.product.name} does not have enough stock.`);
    }

    const lineSubtotal = item.product.price * item.quantity;
    const lineDiscount =
      index === items.length - 1
        ? cleanDiscount - appliedDiscount
        : Math.round((cleanDiscount * (lineSubtotal / subtotal)) * 100) / 100;
    appliedDiscount += lineDiscount;
    const totalRevenue = Math.max(lineSubtotal - lineDiscount, 0);
    const totalCost = item.product.costPrice * item.quantity;
    const unitPrice = totalRevenue / item.quantity;
    const saleRef = doc(salesRef);
    const saleItemRef = doc(saleItemsRef);
    const salePayload = {
      productId: item.product.id,
      productName: item.product.name,
      barcode: item.product.barcode,
      quantity: item.quantity,
      unitPrice,
      unitCost: item.product.costPrice,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      createdBy: user.uid,
      createdByName: user.fullName,
      createdAt: serverTimestamp(),
    };

    batch.update(productRef(item.product.id), {
      stock: item.product.stock - item.quantity,
      updatedAt: serverTimestamp(),
    });
    batch.set(saleRef, salePayload);
    batch.set(saleItemRef, { ...salePayload, saleId: saleRef.id });
  }

  await batch.commit();
  await Promise.all(
    items.map((item) => notifyStockLevel(item.product, item.product.stock - item.quantity))
  );
  await safeLogActivity(user, 'sales_creation');
}
