import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessCollection } from '@/hooks/useBusinessCollection';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { useProducts } from '@/hooks/useProducts';
import { subscribeToCustomers, subscribeToPurchases, subscribeToSuppliers } from '@/services/businessService';
import { subscribeToUsers } from '@/services/userService';
import type { Customer, Purchase, Supplier } from '@/types/business';
import { isSalesperson } from '@/types/user';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const periods: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const periodLabels: Record<ReportPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function timestampDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate() as Date;
  }

  return value instanceof Date ? value : new Date();
}

function periodStart(period: ReportPeriod) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'weekly') {
    start.setDate(start.getDate() - start.getDay());
  } else if (period === 'monthly') {
    start.setDate(1);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
  }

  return start;
}

export default function ReportsScreen() {
  const t = useTranslation();
  const formatMoney = useMoneyFormatter();
  const { userProfile } = useAuth();
  const { products, stats } = useProducts();
  const { expenses, saleItems, sales } = useActivities();
  const { items: purchases } = useBusinessCollection<Purchase>(subscribeToPurchases);
  const { items: customers } = useBusinessCollection<Customer>(subscribeToCustomers);
  const { items: suppliers } = useBusinessCollection<Supplier>(subscribeToSuppliers);
  const { items: users } = useBusinessCollection(subscribeToUsers);
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedCreatorId, setSelectedCreatorId] = useState('all');
  const salesperson = isSalesperson(userProfile);
  const salespeople = users
    .filter((user) => user.role === 'salesperson' && user.isActive !== false)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const filteredCreatorId = salesperson ? userProfile?.uid : selectedCreatorId === 'all' ? null : selectedCreatorId;

  useEffect(() => {
    if (selectedCreatorId === 'all') return;
    if (!salespeople.some((user) => user.uid === selectedCreatorId)) {
      setSelectedCreatorId('all');
    }
  }, [salespeople, selectedCreatorId]);

  const start = useMemo(() => periodStart(period), [period]);
  const visibleSales = sales.filter((sale) => {
    const matchesCreator = !filteredCreatorId || sale.createdBy === filteredCreatorId;
    return matchesCreator && timestampDate(sale.createdAt) >= start;
  });
  const visibleSaleItems = saleItems.filter((item) => {
    const matchesCreator = !filteredCreatorId || item.createdBy === filteredCreatorId;
    return matchesCreator && timestampDate(item.createdAt) >= start;
  });
  const visibleExpenses = expenses.filter((expense) => {
    const matchesCreator = !filteredCreatorId || expense.createdBy === filteredCreatorId;
    return matchesCreator && timestampDate(expense.createdAt) >= start;
  });
  const visiblePurchases = purchases.filter((purchase) => timestampDate(purchase.createdAt) >= start);
  const totalSales = visibleSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
  const totalProfit = visibleSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalExpenses = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPurchases = visiblePurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const netProfit = totalProfit - totalExpenses;
  const lowStockProducts = products.filter((product) => product.stock <= product.minimumStockLevel);
  const bestSellingProducts = Object.values(
    visibleSaleItems.reduce<Record<string, { name: string; quantity: number; revenue: number }>>((acc, item) => {
      acc[item.productId] ??= { name: item.productName, quantity: 0, revenue: 0 };
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.totalRevenue;
      return acc;
    }, {})
  )
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((item) => `${item.name} - ${item.quantity} ${t('sales')} (${formatMoney(item.revenue)})`);
  const topCustomers = [...customers]
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 5)
    .map((item) => `${item.name} - ${formatMoney(item.totalPurchases)}`);
  const topSuppliers = [...suppliers]
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
    .slice(0, 5)
    .map((item) => `${item.name} - ${t('outstanding')} ${formatMoney(item.outstandingBalance)}`);

  return (
    <MobileShell>
      <AppHeader title={t('reports')} left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.periodRow}>
          {periods.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setPeriod(item)}
              style={[styles.periodButton, period === item && styles.periodButtonActive]}>
              <ThemedText style={[styles.periodText, period === item && styles.periodTextActive]}>
                {periodLabels[item]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        {!salesperson ? (
          <View style={styles.filterCard}>
            <ThemedText style={styles.filterLabel}>{t('reportFilter')}</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedCreatorId('all')}
                style={[styles.filterButton, selectedCreatorId === 'all' && styles.filterButtonActive]}>
                <ThemedText style={[styles.filterText, selectedCreatorId === 'all' && styles.filterTextActive]}>
                  {t('allSalespeople')}
                </ThemedText>
              </Pressable>
              {salespeople.map((user) => (
                <Pressable
                  key={user.uid}
                  accessibilityRole="button"
                  onPress={() => setSelectedCreatorId(user.uid)}
                  style={[styles.filterButton, selectedCreatorId === user.uid && styles.filterButtonActive]}>
                  <ThemedText style={[styles.filterText, selectedCreatorId === user.uid && styles.filterTextActive]}>
                    {user.fullName || user.username}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <View style={styles.grid}>
          <Metric label={t('totalSales')} value={formatMoney(totalSales)} />
          {!salesperson ? <Metric label={t('totalPurchases')} value={formatMoney(totalPurchases)} /> : null}
          <Metric label={t('totalExpenses')} value={formatMoney(totalExpenses)} />
          {!salesperson ? <Metric label={t('netProfit')} value={formatMoney(netProfit)} /> : null}
          {!salesperson ? <Metric label={t('inventoryValue')} value={formatMoney(stats.inventoryValue)} /> : null}
          {!salesperson ? <Metric label={t('businessValue')} value={formatMoney(stats.totalValue)} /> : null}
        </View>
        <Chart title={t('incomeVsExpense')} type="line" income={totalSales} expense={totalExpenses} incomeLabel={t('income')} expenseLabel={t('expense')} />
        <Chart title={`${periodLabels[period]} ${t('sales')}`} type="bar" income={totalSales} expense={totalExpenses} incomeLabel={t('income')} expenseLabel={t('expense')} />
        {!salesperson ? <Chart title={t('productCategory')} type="pie" income={stats.inventoryValue} expense={totalExpenses} incomeLabel={t('income')} expenseLabel={t('expense')} /> : null}
        {!salesperson ? <Chart title={t('yearlyComparison')} type="bar" income={totalSales} expense={totalExpenses} incomeLabel={t('income')} expenseLabel={t('expense')} /> : null}
        <List title={t('bestSellingProducts')} items={bestSellingProducts} emptyLabel={t('noDataYet')} />
        {!salesperson ? <List title={t('lowStockProducts')} items={lowStockProducts.map((item) => `${item.name} (${item.stock})`)} emptyLabel={t('noDataYet')} /> : null}
        {!salesperson ? <List title={t('topCustomers')} items={topCustomers} emptyLabel={t('noDataYet')} /> : null}
        {!salesperson ? <List title={t('topSuppliers')} items={topSuppliers} emptyLabel={t('noDataYet')} /> : null}
      </ScrollView>
      <BottomNav active="reports" />
    </MobileShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

function Chart({ title, type, income, expense, incomeLabel, expenseLabel }: { title: string; type: 'line' | 'bar' | 'pie'; income: number; expense: number; incomeLabel: string; expenseLabel: string }) {
  const max = Math.max(income, expense, 1);
  return (
    <View style={styles.chartCard}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <Svg width="100%" height={150}>
        {type === 'line' ? (
          <>
            <Line x1="20" y1={130 - (income / max) * 90} x2="280" y2={130 - (expense / max) * 90} stroke="#0878ff" strokeWidth="4" />
            <Circle cx="20" cy={130 - (income / max) * 90} r="6" fill="#0878ff" />
            <Circle cx="280" cy={130 - (expense / max) * 90} r="6" fill="#f97316" />
          </>
        ) : type === 'bar' ? (
          <>
            <Rect x="55" y={130 - (income / max) * 100} width="64" height={(income / max) * 100} fill="#0878ff" rx="6" />
            <Rect x="170" y={130 - (expense / max) * 100} width="64" height={(expense / max) * 100} fill="#f97316" rx="6" />
          </>
        ) : (
          <>
            <Circle cx="145" cy="75" r="48" fill="#0878ff" />
            <Circle cx="165" cy="75" r="34" fill="#f97316" opacity="0.85" />
          </>
        )}
        <SvgText x="20" y="145" fill="#667085" fontSize="11">{incomeLabel}</SvgText>
        <SvgText x="170" y="145" fill="#667085" fontSize="11">{expenseLabel}</SvgText>
      </Svg>
    </View>
  );
}

function List({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <View style={styles.chartCard}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {items.length ? items.map((item) => <ThemedText key={item} style={styles.listItem}>{item}</ThemedText>) : <ThemedText style={styles.listItem}>{emptyLabel}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 14 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodButton: { borderRadius: 8, borderWidth: 1, borderColor: '#d0d5dd', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8 },
  periodButtonActive: { borderColor: '#0878ff', backgroundColor: '#eaf2ff' },
  periodText: { color: '#344054', fontSize: 12, fontWeight: '900' },
  periodTextActive: { color: '#0878ff' },
  filterCard: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 12, gap: 8 },
  filterLabel: { color: '#101828', fontSize: 14, fontWeight: '900' },
  filterRow: { gap: 8, paddingRight: 2 },
  filterButton: { borderRadius: 8, borderWidth: 1, borderColor: '#d0d5dd', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8 },
  filterButtonActive: { borderColor: '#0878ff', backgroundColor: '#eaf2ff' },
  filterText: { color: '#344054', fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: '#0878ff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '48%', borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 12, gap: 5 },
  metricLabel: { color: '#667085', fontSize: 12, fontWeight: '800' },
  metricValue: { color: '#101828', fontSize: 18, fontWeight: '900' },
  chartCard: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 8 },
  sectionTitle: { color: '#101828', fontSize: 16, fontWeight: '900' },
  listItem: { color: '#667085', fontSize: 13, fontWeight: '700' },
});
