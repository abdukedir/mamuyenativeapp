import { useEffect, useMemo, useState } from 'react';

import { useActivities } from '@/hooks/useActivities';
import { subscribeToProducts } from '@/services/productService';
import type { Product } from '@/types/product';

function getProductStock(product: Product) {
  return Number(product.stock) || 0;
}

function getProductPurchasePrice(product: Product) {
  const legacyProduct = product as Product & {
    buyingPrice?: number;
    purchasePrice?: number;
    purchasingPrice?: number;
  };

  return (
    Number(product.costPrice) ||
    Number(legacyProduct.purchasePrice) ||
    Number(legacyProduct.purchasingPrice) ||
    Number(legacyProduct.buyingPrice) ||
    Number(product.price) ||
    0
  );
}

function isVisibleProduct(product: Product) {
  return product.isActive !== false && product.status !== 'archived';
}

export function useProducts() {
  const { totals } = useActivities();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (items) => {
        setProducts(items.filter(isVisibleProduct));
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
    const totalItems = products.reduce((sum, product) => sum + getProductStock(product), 0);
    const inStockProducts = products.filter((product) => getProductStock(product) > 0).length;
    const lowStockProducts = products.filter((product) => {
      const stock = getProductStock(product);
      return stock > 0 && stock <= 5;
    }).length;
    const outOfStockProducts = products.filter((product) => getProductStock(product) === 0).length;
    const inventoryValue = products.reduce(
      (sum, product) => sum + getProductStock(product) * getProductPurchasePrice(product),
      0
    );
    const totalValue = inventoryValue;

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
