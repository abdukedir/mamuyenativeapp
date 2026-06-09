import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, SlidersHorizontal } from 'lucide-react-native';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ProductArtwork } from '@/components/inventory/product-artwork';
import { SearchBar } from '@/components/inventory/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

const filters = ['All', 'TV', 'Speakers', 'Refrigerators', 'Accessories'];

export default function ProductsScreen() {
  const { error, loading, products } = useProducts();
  const { categories } = useCategories();

  return (
    <MobileShell>
      <AppHeader title="Products" right="search" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}>
        <View style={styles.searchRow}>
          <SearchBar placeholder="Search products" />
          <Pressable style={styles.filterButton}>
            <SlidersHorizontal color="#10172a" size={22} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter, index) => (
            <Pressable key={filter} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
              <ThemedText style={[styles.filterText, index === 0 && styles.filterTextActive]}>
                {filter}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.categoryId === category.id);
            const inStock = categoryProducts.reduce((sum, product) => sum + product.stock, 0);

            return (
            <Pressable
              key={category.id}
              onPress={() => router.push(`/category/${category.id}` as never)}
              style={styles.categoryRow}>
              <ProductArtwork category={category.id} accent={category.accent} />
              <View style={styles.categoryInfo}>
                <ThemedText type="smallBold" style={styles.categoryTitle}>
                  {category.name}
                </ThemedText>
                <ThemedText style={styles.itemCount}>
                  {loading ? 'Loading' : `${categoryProducts.length} Products`}
                </ThemedText>
              <ThemedText type="smallBold" style={styles.stock}>
                In Stock: {loading ? '...' : inStock}
              </ThemedText>
            </View>
              <ChevronRight color="#10172a" size={18} strokeWidth={2.4} />
            </Pressable>
            );
          })}
        </View>
        {!categories.length && !loading ? (
          <ThemedText style={styles.errorText}>No categories yet. A stock manager or admin must create one first.</ThemedText>
        ) : null}
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      </ScrollView>
      <BottomNav active="products" />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 18,
    gap: 18,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  filterButton: {
    width: 42,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    gap: 14,
    paddingRight: 20,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#0878ff',
  },
  filterText: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    gap: 14,
  },
  categoryRow: {
    minHeight: 106,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 16,
  },
  categoryInfo: {
    flex: 1,
    gap: 5,
  },
  categoryTitle: {
    color: '#10172a',
    fontSize: 18,
    lineHeight: 22,
  },
  itemCount: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  stock: {
    color: '#059447',
    fontSize: 14,
    lineHeight: 18,
  },
  errorText: {
    color: '#d92d20',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
