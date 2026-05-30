import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  CircleX,
  Box,
  DollarSign,
  Plus,
  ScanLine,
  TriangleAlert,
} from 'lucide-react-native';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ProductArtwork } from '@/components/inventory/product-artwork';
import { ThemedText } from '@/components/themed-text';
import { categorySummaries } from '@/constants/inventory-data';

const stats = [
  { label: 'In Stock', value: '96', Icon: CheckCircle2, color: '#20bf6b', bg: '#eafaf0' },
  { label: 'Low Stock', value: '18', Icon: TriangleAlert, color: '#ff8a00', bg: '#fff2e4' },
  { label: 'Out of Stock', value: '14', Icon: CircleX, color: '#f04452', bg: '#feecee' },
  { label: 'Total Value', value: '$45,680', Icon: DollarSign, color: '#0878ff', bg: '#eaf2ff' },
];

const actions = [
  { label: 'Add Item', Icon: Plus, color: '#0878ff', bg: '#eaf2ff', href: '/add-product' },
  { label: 'Scan', Icon: ScanLine, color: '#16a34a', bg: '#eafaf0', href: '/scan' },
  { label: 'Reports', Icon: BarChart3, color: '#7c3aed', bg: '#f1e9ff', href: '/reports' },
  { label: 'Alerts', Icon: Bell, color: '#f97316', bg: '#fff0e5', href: '/alerts' },
];

export default function DashboardScreen() {
  return (
    <MobileShell>
      <AppHeader title="Dashboard" right="bell" badge={2} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}>
        <View style={styles.hero}>
          <View>
            <ThemedText style={styles.heroLabel}>Total Items</ThemedText>
            <ThemedText style={styles.heroValue}>128</ThemedText>
          </View>
          <View style={styles.heroCube}>
            <Box color="#8fc3ff" size={62} strokeWidth={1.9} />
          </View>
        </View>

        <View style={styles.statGrid}>
          {stats.map(({ Icon, ...stat }) => (
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
          Categories
        </ThemedText>
        <View style={styles.categoryGrid}>
          {categorySummaries.map((category) => (
            <Pressable
              key={category.slug}
              onPress={() => router.push(`/category/${category.slug}` as never)}
              style={styles.categoryCard}>
              <ProductArtwork category={category.slug} accent={category.accent} size="small" />
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
              <ThemedText style={styles.categoryCount}>{category.items}</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionGrid}>
          {actions.map(({ Icon, ...action }) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.href as never)}
              style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Icon color={action.color} size={26} strokeWidth={2.4} />
              </View>
              <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
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
    fontSize: 38,
    lineHeight: 48,
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
  actionGrid: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  actionCard: {
    flex: 1,
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
