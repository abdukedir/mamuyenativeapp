import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { ProductArtwork } from '@/components/inventory/product-artwork';
import { ThemedText } from '@/components/themed-text';
import type { ProductItem } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';

export function ProductRow({ product, compact = false }: { product: ProductItem; compact?: boolean }) {
  const theme = useTheme();

  return (
    <Pressable style={[styles.row, compact && styles.compactRow]}>
      <ProductArtwork category={product.category} accent={product.accent} size={compact ? 'small' : 'medium'} />
      <View style={styles.info}>
        <ThemedText type="smallBold" style={styles.name}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" style={styles.sku}>
          SKU: {product.sku}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.stock}>
          In Stock: {product.stock}
        </ThemedText>
      </View>
      <View style={styles.trailing}>
        <ThemedText type="smallBold" style={styles.price}>
          {product.price}
        </ThemedText>
        <ChevronRight color={theme.text} size={18} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 94,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  compactRow: {
    minHeight: 78,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
  },
  sku: {
    color: '#737f93',
    fontSize: 12,
    lineHeight: 16,
  },
  stock: {
    color: '#059447',
    fontSize: 13,
    lineHeight: 18,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 18,
  },
  price: {
    fontSize: 13,
    lineHeight: 18,
  },
});
