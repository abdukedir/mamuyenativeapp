import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ProductRow } from '@/components/inventory/product-row';
import { SearchBar } from '@/components/inventory/search-bar';
import { ThemedText } from '@/components/themed-text';
import { CategorySlug, getCategory, getProductsByCategory } from '@/constants/inventory-data';

const allowedSlugs = ['tv', 'speakers', 'refrigerators', 'accessories'];

export default function CategoryProductsScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = allowedSlugs.includes(params.slug ?? '') ? (params.slug as CategorySlug) : 'tv';
  const category = getCategory(slug);
  const products = getProductsByCategory(slug);

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
              No products found.
            </ThemedText>
          </View>
        )}
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
});
