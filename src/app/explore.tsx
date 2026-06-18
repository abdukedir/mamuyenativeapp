import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Grid2X2, List } from 'lucide-react-native';
import { useMemo, useState } from 'react';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ProductArtwork } from '@/components/inventory/product-artwork';
import { ProductRow } from '@/components/inventory/product-row';
import { SearchBar } from '@/components/inventory/search-bar';
import { ThemedText } from '@/components/themed-text';
import { getLanguageLabel, useAppSettings, useTranslation } from '@/hooks/useAppSettings';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

type ProductViewMode = 'categories' | 'list';

export default function ProductsScreen() {
  const t = useTranslation();
  const { settings } = useAppSettings();
  const { error, loading, products } = useProducts();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ProductViewMode>('categories');
  const normalizedSearch = search.trim().toLowerCase();

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;
        const matchesSearch =
          !normalizedSearch ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.sku.toLowerCase().includes(normalizedSearch) ||
          product.barcode.toLowerCase().includes(normalizedSearch) ||
          product.categoryName.toLowerCase().includes(normalizedSearch);

        return matchesCategory && matchesSearch;
      }),
    [normalizedSearch, products, selectedCategoryId]
  );

  const visibleCategories = useMemo(
    () =>
      categories.filter((category) => {
        if (selectedCategoryId && category.id !== selectedCategoryId) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const categoryProducts = products.filter((product) => product.categoryId === category.id);

        return (
          category.name.toLowerCase().includes(normalizedSearch) ||
          categoryProducts.some(
            (product) =>
              product.name.toLowerCase().includes(normalizedSearch) ||
              product.sku.toLowerCase().includes(normalizedSearch) ||
              product.barcode.toLowerCase().includes(normalizedSearch)
          )
        );
      }),
    [categories, normalizedSearch, products, selectedCategoryId]
  );

  function chooseCategory(categoryId: string | null) {
    setSelectedCategoryId(categoryId);

    if (categoryId) {
      setViewMode('list');
    }
  }

  return (
    <MobileShell>
      <AppHeader title={t('products')} right="none" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}>
        <View style={styles.statusRow}>
          <ThemedText style={styles.statusText}>
            {t('language')}: {getLanguageLabel(settings.language)}
          </ThemedText>
          <ThemedText style={styles.statusText}>
            {visibleProducts.length} {t('products')}
          </ThemedText>
        </View>
        <View style={styles.searchRow}>
          <SearchBar
            onChangeText={setSearch}
            placeholder={t('searchProduct')}
            value={search}
          />
          <Pressable
            accessibilityLabel={viewMode === 'categories' ? 'Show product list' : 'Show categories'}
            accessibilityRole="button"
            onPress={() => setViewMode((current) => (current === 'categories' ? 'list' : 'categories'))}
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}>
            {viewMode === 'categories' ? (
              <List color="#10172a" size={22} strokeWidth={2.2} />
            ) : (
              <Grid2X2 color="#ffffff" size={22} strokeWidth={2.2} />
            )}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Pressable
            accessibilityRole="button"
            onPress={() => chooseCategory(null)}
            style={[styles.filterChip, !selectedCategoryId && styles.filterChipActive]}>
            <ThemedText style={[styles.filterText, !selectedCategoryId && styles.filterTextActive]}>
              All
            </ThemedText>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              onPress={() => chooseCategory(category.id)}
              style={[styles.filterChip, selectedCategoryId === category.id && styles.filterChipActive]}>
              <ThemedText style={[styles.filterText, selectedCategoryId === category.id && styles.filterTextActive]}>
                {category.name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {viewMode === 'categories' ? visibleCategories.map((category) => {
            const categoryProducts = products.filter((product) => product.categoryId === category.id);
            const searchProducts = visibleProducts.filter((product) => product.categoryId === category.id);
            const inStock = categoryProducts.reduce((sum, product) => sum + product.stock, 0);
            const visibleCount = normalizedSearch || selectedCategoryId ? searchProducts.length : categoryProducts.length;

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
                  {loading ? 'Loading' : `${visibleCount} ${t('products')}`}
                </ThemedText>
              <ThemedText type="smallBold" style={styles.stock}>
                {t('inStock')}: {loading ? '...' : inStock}
              </ThemedText>
            </View>
              <ChevronRight color="#10172a" size={18} strokeWidth={2.4} />
            </Pressable>
            );
          }) : visibleProducts.map((product) => (
            <ProductRow key={product.id} product={product} compact />
          ))}
        </View>
        {viewMode === 'categories' && !visibleCategories.length && !loading ? (
          <ThemedText style={styles.errorText}>No categories yet. An active registered user must create one first.</ThemedText>
        ) : null}
        {viewMode === 'list' && !visibleProducts.length && !loading ? (
          <ThemedText style={styles.errorText}>No products match your search.</ThemedText>
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
  statusRow: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: '#f5f9ff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusText: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  viewButton: {
    width: 42,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f5f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#0878ff',
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
