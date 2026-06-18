import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  CircleX,
  Box,
  Bell,
  Boxes,
  CreditCard,
  DollarSign,
  PackageSearch,
  Plus,
  ReceiptText,
  ScanLine,
  Settings,
  Truck,
  Users,
  TriangleAlert,
} from 'lucide-react-native';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ProductArtwork } from '@/components/inventory/product-artwork';
import { ThemedText } from '@/components/themed-text';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { getLanguageLabel, useAppSettings, useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { useProducts } from '@/hooks/useProducts';
import type { TranslationKey } from '@/i18n/translations';
import { isSalesperson } from '@/types/user';

const dashboardCards = [
  { labelKey: 'products', Icon: PackageSearch, color: '#0878ff', bg: '#eaf2ff', href: '/explore' },
  { labelKey: 'sales', Icon: ScanLine, color: '#16a34a', bg: '#eafaf0', href: '/sales' },
  { labelKey: 'purchases', Icon: Boxes, color: '#0f766e', bg: '#e7f8f5', href: '/purchases' },
  { labelKey: 'expenses', Icon: ReceiptText, color: '#f97316', bg: '#fff0e5', href: '/expense' },
  { labelKey: 'customers', Icon: Users, color: '#2563eb', bg: '#eaf2ff', href: '/customers' },
  { labelKey: 'suppliers', Icon: Truck, color: '#7c2d12', bg: '#fff4ed', href: '/suppliers' },
  { labelKey: 'credits', Icon: CreditCard, color: '#be123c', bg: '#fff1f2', href: '/credits' },
  { labelKey: 'reports', Icon: BarChart3, color: '#7c3aed', bg: '#f1e9ff', href: '/reports' },
  { labelKey: 'notifications', Icon: Bell, color: '#ca8a04', bg: '#fef9c3', href: '/notifications' },
  { labelKey: 'addProduct', Icon: Plus, color: '#101828', bg: '#f2f4f7', href: '/add-product' },
];

export default function DashboardScreen() {
  const t = useTranslation();
  const { userProfile } = useAuth();
  const { error, loading, products, stats } = useProducts();
  const { categories } = useCategories();
  const { settings } = useAppSettings();
  const formatMoney = useMoneyFormatter();
  const dashboardStats = [
    { label: t('inStock'), value: String(stats.inStockProducts), Icon: CheckCircle2, color: '#20bf6b', bg: '#eafaf0' },
    { label: t('lowStock'), value: String(stats.lowStockProducts), Icon: TriangleAlert, color: '#ff8a00', bg: '#fff2e4' },
    { label: t('businessValue'), value: formatMoney(stats.totalValue), Icon: DollarSign, color: '#0878ff', bg: '#eaf2ff' },
    { label: t('expenses'), value: formatMoney(stats.totalExpenses), Icon: ReceiptText, color: '#f97316', bg: '#fff0e5' },
    { label: t('sales'), value: formatMoney(stats.totalSales), Icon: ScanLine, color: '#16a34a', bg: '#eafaf0' },
    { label: t('outOfStock'), value: String(stats.outOfStockProducts), Icon: CircleX, color: '#f04452', bg: '#feecee' },
  ];

  useEffect(() => {
    if (isSalesperson(userProfile)) {
      router.replace('/sales' as never);
    }
  }, [userProfile]);

  return (
    <MobileShell>
      <AppHeader
        title={t('dashboard')}
        right="none"
        rightContent={
          <Pressable
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            onPress={() => router.push('/settings' as never)}
            style={styles.settingsChip}>
            <Settings color="#0878ff" size={16} strokeWidth={2.4} />
            <View style={styles.settingsText}>
              <ThemedText style={styles.settingsPrimary}>{settings.currency}</ThemedText>
              <ThemedText style={styles.settingsSecondary}>
                {getLanguageLabel(settings.language)} · {settings.theme}
              </ThemedText>
            </View>
          </Pressable>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}>
        <View style={styles.hero}>
          <View>
            <ThemedText style={styles.heroLabel}>{t('businessValue')}</ThemedText>
            <ThemedText style={styles.heroValue}>{loading ? '...' : formatMoney(stats.totalValue)}</ThemedText>
            <ThemedText style={styles.heroMeta}>{t('totalItems')}: {loading ? '...' : stats.totalItems}</ThemedText>
          </View>
          <View style={styles.heroCube}>
            <Box color="#8fc3ff" size={62} strokeWidth={1.9} />
          </View>
        </View>

        <View style={styles.statGrid}>
          {dashboardStats.map(({ Icon, ...stat }) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Icon color={stat.color} size={24} strokeWidth={2.4} />
              </View>
              <View style={styles.statText}>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          {t('categories')}
        </ThemedText>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const count = products.filter((product) => product.categoryId === category.id).length;

            return (
            <Pressable
              key={category.id}
              onPress={() => router.push(`/category/${category.id}` as never)}
              style={styles.categoryCard}>
              <ProductArtwork category={category.id} accent={category.accent} size="small" />
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
              <ThemedText style={styles.categoryCount}>{count}</ThemedText>
            </Pressable>
            );
          })}
        </View>
        {!categories.length && !loading ? (
          <ThemedText style={styles.emptyText}>Create a category before adding products.</ThemedText>
        ) : null}
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          {t('dashboard')}
        </ThemedText>
        <View style={styles.actionGrid}>
          {dashboardCards.map(({ Icon, ...action }) => (
            <Pressable
              key={action.labelKey}
              onPress={() => router.push(action.href as never)}
              style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Icon color={action.color} size={26} strokeWidth={2.4} />
              </View>
              <ThemedText style={styles.actionLabel}>{t(action.labelKey as TranslationKey)}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="home" />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 18,
    gap: 18,
  },
  hero: {
    height: 116,
    borderRadius: 12,
    backgroundColor: '#0878ff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0878ff',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroLabel: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  heroValue: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
  },
  heroMeta: {
    color: '#eaf2ff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  heroCube: {
    opacity: 0.92,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statCard: {
    width: '47.8%',
    minHeight: 94,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
    gap: 5,
  },
  statLabel: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  statValue: {
    color: '#10172a',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#10172a',
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  categoryName: {
    color: '#10172a',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  categoryCount: {
    color: '#10172a',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  settingsChip: {
    minWidth: 126,
    maxWidth: 166,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#f5f9ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 9,
  },
  settingsText: {
    flexShrink: 1,
  },
  settingsPrimary: {
    color: '#0878ff',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  settingsSecondary: {
    color: '#475467',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#d92d20',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  actionCard: {
    width: '33.33%',
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#edf0f5',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
});
