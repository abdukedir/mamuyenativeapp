import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ProductRow } from '@/components/inventory/product-row';
import { SearchBar } from '@/components/inventory/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

export default function CategoryProductsScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const { categories } = useCategories();
  const category = categories.find((item) => item.id === params.slug);
  const categoryId = params.slug ?? '';
  const { error, loading, getProductsByCategory } = useProducts();
  const products = getProductsByCategory(categoryId);

  return (
    <MobileShell>
      <AppHeader
        title={category?.name ?? 'Products'}
        left="back"
        right="filter"
        onLeftPress={() => router.back()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}>
        <View style={styles.searchRow}>
          <SearchBar placeholder={`Search ${category?.name.toLowerCase() ?? 'products'}`} />
        </View>

        <View style={styles.list}>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} compact />
          ))}
        </View>

        {!products.length && (
          <View style={styles.empty}>
            <ThemedText type="small" themeColor="textSecondary">
              {loading ? 'Loading products...' : 'No products found.'}
            </ThemedText>
          </View>
        )}
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
    gap: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#d92d20',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
