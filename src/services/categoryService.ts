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
import { categoryAccentOptions, type ProductCategory } from '@/types/product';
import type { UserProfile } from '@/types/user';
import type { CategoryFormValues } from '@/validations/productSchemas';

const categoriesCollection = 'categories';
const categoriesRef = collection(firestore, categoriesCollection);

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function subscribeToCategories(
  onCategories: (categories: ProductCategory[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(categoriesRef, orderBy('name', 'asc')),
    (snapshot) => {
      onCategories(
        snapshot.docs.map((document) => ({
          ...(document.data() as Omit<ProductCategory, 'id'>),
          id: document.id,
        }))
      );
    },
    onError
  );
}

export async function createCategory(values: CategoryFormValues, owner: UserProfile) {
  const now = serverTimestamp() as Timestamp;

  const created = await addDoc(categoriesRef, {
    name: cleanText(values.name),
    accent: values.accent || categoryAccentOptions[0],
    createdBy: owner.uid,
    createdAt: now,
    updatedAt: now,
  });
  return created.id;
}
