import { router } from 'expo-router';
import { Minus, Plus, ScanLine, ShoppingCart } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { BarcodeScannerView } from '@/components/inventory/barcode-scanner-view';
import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { checkoutProducts } from '@/services/productService';
import { formatProductPrice, type Product } from '@/types/product';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export default function SalesScreen() {
  const { userProfile } = useAuth();
  const { products } = useProducts();
  const { totals } = useActivities();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const canSell = userProfile?.role === 'sales' || userProfile?.role === 'admin';

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value) ||
        product.barcode.toLowerCase().includes(value)
    );
  }, [products, search]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = products.find((item) => item.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter((item): item is { product: Product; quantity: number } => Boolean(item)),
    [cart, products]
  );
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartProfit = cartItems.reduce(
    (sum, item) => sum + (item.product.price - item.product.costPrice) * item.quantity,
    0
  );

  function addToCart(product: Product) {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Please sign in before selling products.');
      return;
    }

    if (!canSell) {
      Alert.alert('Permission required', 'Only sales users and admins can sell products.');
      return;
    }

    if (product.stock <= 0) {
      Alert.alert('Out of stock', 'This product cannot be sold right now.');
      return;
    }

    setCart((current) => {
      const currentQuantity = current[product.id] ?? 0;

      if (currentQuantity >= product.stock) {
        Alert.alert('Stock limit reached', 'Cart quantity cannot exceed available stock.');
        return current;
      }

      return { ...current, [product.id]: currentQuantity + 1 };
    });
    setLastScannedProduct(product);
  }

  function updateCartQuantity(product: Product, delta: number) {
    setCart((current) => {
      const nextQuantity = (current[product.id] ?? 0) + delta;

      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }

      if (nextQuantity > product.stock) {
        Alert.alert('Stock limit reached', 'Cart quantity cannot exceed available stock.');
        return current;
      }

      return { ...current, [product.id]: nextQuantity };
    });
  }

  async function checkout() {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Please sign in before checkout.');
      return;
    }

    if (!cartItems.length) {
      Alert.alert('Cart is empty', 'Add at least one product to checkout.');
      return;
    }

    try {
      await checkoutProducts(cartItems, userProfile);
      setCart({});
      setLastScannedProduct(null);
      Alert.alert('Checkout complete', 'Sale, stock, and total value were updated.');
    } catch (error) {
      Alert.alert('Checkout failed', getFirebaseErrorMessage(error));
    }
  }

  function handleBarcode(data: string) {
    const code = data.trim();
    const product = products.find((item) => item.barcode.trim() === code);

    setScannerOpen(false);
    setSearch(code);
    if (!product) {
      Alert.alert('Product not found', 'No product matches this barcode.');
      return;
    }

    addToCart(product);
  }

  return (
    <MobileShell>
      <Modal
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
        presentationStyle="fullScreen"
        visible={scannerOpen}>
        <BarcodeScannerView
          title="Scan product to sell"
          onCancel={() => setScannerOpen(false)}
          onScanned={handleBarcode}
        />
      </Modal>
      <AppHeader title="Sales" left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View>
            <ThemedText style={styles.summaryLabel}>Sales revenue</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatProductPrice(totals.totalSales)}</ThemedText>
          </View>
          <View style={styles.summarySide}>
            <ThemedText style={styles.summaryLabel}>Profit</ThemedText>
            <ThemedText style={styles.profit}>{formatProductPrice(totals.totalProfit)}</ThemedText>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <AuthInput
              label="Browse by name, SKU, or barcode"
              onChangeText={setSearch}
              placeholder="Search product"
              value={search}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setScannerOpen(true)} style={styles.scanButton}>
            <ScanLine color="#ffffff" size={24} strokeWidth={2.4} />
          </Pressable>
        </View>

        {lastScannedProduct ? (
          <View style={styles.scannedPanel}>
            <ThemedText style={styles.panelTitle}>Scanned product</ThemedText>
            <ThemedText style={styles.productName}>{lastScannedProduct.name}</ThemedText>
            <ThemedText style={styles.productMeta}>Barcode: {lastScannedProduct.barcode}</ThemedText>
            <ThemedText style={styles.productMeta}>SKU: {lastScannedProduct.sku}</ThemedText>
            <ThemedText style={styles.productMeta}>Stock: {lastScannedProduct.stock}</ThemedText>
            <ThemedText style={styles.price}>
              Selling price: {formatProductPrice(lastScannedProduct.price)}
            </ThemedText>
            <ThemedText style={styles.productMeta}>
              Profit per item: {formatProductPrice(lastScannedProduct.price - lastScannedProduct.costPrice)}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.checkoutPanel}>
          <View style={styles.checkoutHeader}>
            <View style={styles.checkoutTitleRow}>
              <ShoppingCart color="#0878ff" size={20} strokeWidth={2.4} />
              <ThemedText style={styles.panelTitle}>Checkout</ThemedText>
            </View>
            <ThemedText style={styles.productMeta}>{cartItems.length} items</ThemedText>
          </View>
          {cartItems.length ? (
            <View style={styles.cartList}>
              {cartItems.map(({ product, quantity }) => (
                <View key={product.id} style={styles.cartRow}>
                  <View style={styles.productInfo}>
                    <ThemedText style={styles.productName}>{product.name}</ThemedText>
                    <ThemedText style={styles.productMeta}>
                      {formatProductPrice(product.price)} x {quantity}
                    </ThemedText>
                  </View>
                  <View style={styles.quantityControls}>
                    <Pressable
                      accessibilityLabel="Decrease quantity"
                      accessibilityRole="button"
                      onPress={() => updateCartQuantity(product, -1)}
                      style={styles.quantityButton}>
                      <Minus color="#0878ff" size={16} strokeWidth={2.6} />
                    </Pressable>
                    <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
                    <Pressable
                      accessibilityLabel="Increase quantity"
                      accessibilityRole="button"
                      onPress={() => updateCartQuantity(product, 1)}
                      style={styles.quantityButton}>
                      <Plus color="#0878ff" size={16} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.productMeta}>Scan or browse products to add them here.</ThemedText>
          )}
          <View style={styles.checkoutTotals}>
            <ThemedText style={styles.totalText}>Total: {formatProductPrice(cartTotal)}</ThemedText>
            <ThemedText style={styles.profitText}>Profit: {formatProductPrice(cartProfit)}</ThemedText>
          </View>
          <AuthButton disabled={!cartItems.length || !canSell} title="Checkout" onPress={checkout} />
        </View>

        <View style={styles.list}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productMeta}>Barcode: {product.barcode}</ThemedText>
                <ThemedText style={styles.productMeta}>Stock: {product.stock}</ThemedText>
              </View>
              <View style={styles.productAction}>
                <ThemedText style={styles.price}>{formatProductPrice(product.price)}</ThemedText>
                <AuthButton
                  disabled={!canSell || product.stock <= 0}
                  title="Add"
                  onPress={() => addToCart(product)}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="products" />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 22,
    gap: 16,
  },
  summary: {
    borderRadius: 12,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  summarySide: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: '#027a48',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  summaryValue: {
    color: '#101828',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  profit: {
    color: '#047857',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  searchInput: {
    flex: 1,
  },
  scanButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0878ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  scannedPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#f5f9ff',
    padding: 14,
    gap: 5,
  },
  checkoutPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 12,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checkoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    color: '#101828',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  cartList: {
    gap: 8,
  },
  cartRow: {
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#f5f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    minWidth: 18,
    color: '#101828',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  checkoutTotals: {
    gap: 3,
  },
  totalText: {
    color: '#101828',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  profitText: {
    color: '#047857',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  productRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  productInfo: {
    flex: 1,
    gap: 3,
  },
  productName: {
    color: '#101828',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  productMeta: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  productAction: {
    width: 92,
    gap: 8,
  },
  price: {
    color: '#101828',
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
});
