import { useEffect, useState } from 'react';

import { subscribeToCategories } from '@/services/categoryService';
import type { ProductCategory } from '@/types/product';

export function useCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCategories(
      (items) => {
        setCategories(items);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { categories, loading, error };
}
