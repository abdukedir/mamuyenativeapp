import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { ProductArtwork } from '@/components/inventory/product-artwork';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { sellProduct, updateProductStock } from '@/services/productService';
import { formatProductPrice, getProductProfit, type Product } from '@/types/product';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export function ProductRow({ product, compact = false }: { product: Product; compact?: boolean }) {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const canSell = userProfile?.role === 'sales' || userProfile?.role === 'admin';
  const canManageStock = userProfile?.role === 'stock_manager' || userProfile?.role === 'admin';

  async function handleSell() {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Please sign in before selling products.');
      return;
    }

    try {
      await sellProduct(product, userProfile);
    } catch (error) {
      Alert.alert('Sale failed', getFirebaseErrorMessage(error));
    }
  }

  async function handleStockChange(delta: number) {
    const nextStock = product.stock + delta;

    if (nextStock < 0) {
      Alert.alert('Stock unavailable', 'Stock cannot go below zero.');
      return;
    }

    try {
      await updateProductStock(product, nextStock);
    } catch (error) {
      Alert.alert('Stock update failed', getFirebaseErrorMessage(error));
    }
  }

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <ProductArtwork
        category={product.categoryId}
        accent={product.categoryAccent}
        size={compact ? 'small' : 'medium'}
      />
      <View style={styles.info}>
        <ThemedText type="smallBold" style={styles.name}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" style={styles.sku}>
          SKU: {product.sku}
        </ThemedText>
        <ThemedText type="small" style={styles.sku}>
          Barcode: {product.barcode}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.stock}>
          In Stock: {product.stock}
        </ThemedText>
      </View>
      <View style={styles.trailing}>
        <ThemedText type="smallBold" style={styles.price}>
          {formatProductPrice(product.price)}
        </ThemedText>
        <ThemedText type="small" style={styles.profit}>
          Profit: {formatProductPrice(getProductProfit(product))}
        </ThemedText>
        <ChevronRight color={theme.text} size={18} strokeWidth={2.4} />
      </View>
      {(canSell || canManageStock) && (
        <View style={styles.actions}>
          {canSell ? (
            <Pressable
              accessibilityRole="button"
              disabled={product.stock <= 0}
              onPress={handleSell}
              style={[styles.actionButton, product.stock <= 0 && styles.actionButtonDisabled]}>
              <ThemedText style={styles.actionText}>Sell</ThemedText>
            </Pressable>
          ) : null}
          {canManageStock ? (
            <View style={styles.stockControls}>
              <Pressable
                accessibilityLabel="Decrease stock"
                accessibilityRole="button"
                onPress={() => handleStockChange(-1)}
                style={styles.stockButton}>
                <ThemedText style={styles.stockButtonText}>-</ThemedText>
              </Pressable>
              <Pressable
                accessibilityLabel="Increase stock"
                accessibilityRole="button"
                onPress={() => handleStockChange(1)}
                style={styles.stockButton}>
                <ThemedText style={styles.stockButtonText}>+</ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </View>
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
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    minHeight: 48,
  },
  price: {
    fontSize: 13,
    lineHeight: 18,
  },
  profit: {
    color: '#059447',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: '#0878ff',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#98a2b3',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  stockControls: {
    flexDirection: 'row',
    gap: 8,
  },
  stockButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#f5f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockButtonText: {
    color: '#0878ff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
});
