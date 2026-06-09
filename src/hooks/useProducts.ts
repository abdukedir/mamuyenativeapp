import { useEffect, useMemo, useState } from 'react';

import { useActivities } from '@/hooks/useActivities';
import { subscribeToProducts } from '@/services/productService';
import type { Product } from '@/types/product';

export function useProducts() {
  const { totals } = useActivities();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (items) => {
        setProducts(items.filter((product) => product.isActive && product.status === 'active'));
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

  const stats = useMemo(() => {
    const totalItems = products.reduce((sum, product) => sum + product.stock, 0);
    const inStockProducts = products.filter((product) => product.stock > 0).length;
    const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
    const outOfStockProducts = products.filter((product) => product.stock === 0).length;
    const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.price, 0);
    const totalValue = inventoryValue - totals.totalExpenses;

    return {
      totalItems,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      inventoryValue,
      totalValue,
      totalExpenses: totals.totalExpenses,
      totalSales: totals.totalSales,
      totalProfit: totals.totalProfit,
    };
  }, [products, totals.totalExpenses, totals.totalProfit, totals.totalSales]);

  const getProductsByCategory = (categoryId: string) =>
    products.filter((product) => product.categoryId === categoryId);

  return {
    products,
    loading,
    error,
    stats,
    getProductsByCategory,
  };
}
