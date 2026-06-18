import { useEffect, useMemo, useState } from 'react';

import { subscribeToExpenses, subscribeToSaleItems, subscribeToSales } from '@/services/activityService';
import type { Expense, Sale, SaleItem } from '@/types/activity';

export function useActivities() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeExpenses = subscribeToExpenses(
      (items) => {
        setExpenses(items);
        setError(null);
      },
      (snapshotError) => setError(snapshotError.message)
    );
    const unsubscribeSales = subscribeToSales(
      (items) => {
        setSales(items);
        setError(null);
      },
      (snapshotError) => setError(snapshotError.message)
    );
    const unsubscribeSaleItems = subscribeToSaleItems(
      (items) => {
        setSaleItems(items);
        setError(null);
      },
      (snapshotError) => setError(snapshotError.message)
    );

    return () => {
      unsubscribeExpenses();
      unsubscribeSales();
      unsubscribeSaleItems();
    };
  }, []);

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    return { totalExpenses, totalSales, totalProfit };
  }, [expenses, sales]);

  return { expenses, saleItems, sales, totals, error };
}
