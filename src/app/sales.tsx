import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Minus, Plus, ScanLine, ShoppingCart } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { BarcodeScannerView } from '@/components/inventory/barcode-scanner-view';
import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { useProducts } from '@/hooks/useProducts';
import { checkoutProducts } from '@/services/productService';
import type { Product } from '@/types/product';
import { canAccessAllApp, isSalesperson } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

function normalizeBarcode(value: string) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function barcodeMatches(productBarcode: string, scannedBarcode: string) {
  const productCode = normalizeBarcode(productBarcode);
  const scannedCode = normalizeBarcode(scannedBarcode);

  return (
    productCode === scannedCode ||
    productCode.replace(/^0+/, '') === scannedCode.replace(/^0+/, '')
  );
}

function createReceiptText(input: {
  cashier: string;
  items: { product: Product; quantity: number }[];
  subtotal: number;
  discount: number;
  total: number;
  formatMoney: (value: number) => string;
}) {
  const lines = input.items.map(
    ({ product, quantity }) =>
      `${product.name} x ${quantity} = ${input.formatMoney(product.price * quantity)}`
  );

  return [
    'Mamuye receipt',
    `Date: ${new Date().toLocaleString()}`,
    `Cashier: ${input.cashier}`,
    '',
    ...lines,
    '',
    `Subtotal: ${input.formatMoney(input.subtotal)}`,
    `Discount: ${input.formatMoney(input.discount)}`,
    `Total: ${input.formatMoney(input.total)}`,
  ].join('\n');
}

export default function SalesScreen() {
  const { userProfile } = useAuth();
  const t = useTranslation();
  const formatMoney = useMoneyFormatter();
  const { error: productsError, products } = useProducts();
  const { expenses, sales, totals } = useActivities();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discountAmount, setDiscountAmount] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const canSell = canAccessAllApp(userProfile);
  const salesperson = isSalesperson(userProfile);
  const visibleSalesTotals = useMemo(() => {
    if (!salesperson || !userProfile) {
      return totals;
    }

    const ownSales = sales.filter((sale) => sale.createdBy === userProfile.uid);
    return {
      totalExpenses: expenses.filter((expense) => expense.createdBy === userProfile.uid).reduce((sum, expense) => sum + expense.amount, 0),
      totalSales: ownSales.reduce((sum, sale) => sum + sale.totalRevenue, 0),
      totalProfit: ownSales.reduce((sum, sale) => sum + sale.profit, 0),
    };
  }, [expenses, salesperson, sales, totals, userProfile]);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value) ||
        normalizeBarcode(product.barcode).includes(normalizeBarcode(value))
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
  const discountValue = Math.max(Number(discountAmount) || 0, 0);
  const safeDiscount = Math.min(discountValue, cartTotal);
  const payableTotal = Math.max(cartTotal - safeDiscount, 0);
  const cartProfit = cartItems.reduce(
    (sum, item) => sum + (item.product.price - item.product.costPrice) * item.quantity,
    0
  );
  const payableProfit = cartProfit - safeDiscount;

  function addToCart(product: Product) {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), t('pleaseSignInBeforeSelling'));
      return;
    }

    if (!canSell) {
      Alert.alert(t('permissionRequired'), t('onlySalesRolesCanSell'));
      return;
    }

    if (product.stock <= 0) {
      Alert.alert(t('outOfStock'), t('outOfStockMessage'));
      return;
    }

    setCart((current) => {
      const currentQuantity = current[product.id] ?? 0;

      if (currentQuantity >= product.stock) {
        Alert.alert(t('stockLimitReached'), t('cartQuantityCannotExceedStock'));
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
        Alert.alert(t('stockLimitReached'), t('cartQuantityCannotExceedStock'));
        return current;
      }

      return { ...current, [product.id]: nextQuantity };
    });
  }

  async function checkout() {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), t('pleaseSignInBeforeCheckout'));
      return;
    }

    if (!canSell) {
      Alert.alert(t('permissionRequired'), t('onlySalesRolesCanSell'));
      return;
    }

    if (!cartItems.length) {
      Alert.alert(t('cartIsEmpty'), t('addAtLeastOneProductToCheckout'));
      return;
    }

    if (discountValue > cartTotal) {
      Alert.alert(t('invalidDiscount'), t('discountCannotExceedTotal'));
      return;
    }

    setCheckingOut(true);

    try {
      const receipt = createReceiptText({
        cashier: userProfile.fullName,
        discount: safeDiscount,
        formatMoney,
        items: cartItems,
        subtotal: cartTotal,
        total: payableTotal,
      });
      await checkoutProducts(cartItems, userProfile, safeDiscount);
      await Clipboard.setStringAsync(receipt);
      setCart({});
      setDiscountAmount('');
      setLastScannedProduct(null);
      Alert.alert(t('checkoutComplete'), `${t('saleStockTotalUpdated')}\n\n${t('receiptCopied')}`);
    } catch (error) {
      Alert.alert(t('checkoutFailed'), getFirebaseErrorMessage(error));
    } finally {
      setCheckingOut(false);
    }
  }

  function openScanner() {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), t('pleaseSignInBeforeSelling'));
      return;
    }

    if (!canSell) {
      Alert.alert(t('permissionRequired'), t('onlySalesRolesCanSell'));
      return;
    }

    if (!products.length) {
      Alert.alert(t('noProducts'), t('createProductsWithBarcodesBeforeScanning'));
      return;
    }

    setScannerOpen(true);
  }

  function handleBarcode(data: string) {
    const code = data.trim();
    const product = products.find((item) => barcodeMatches(item.barcode, code));

    setScannerOpen(false);
    setSearch(code);
    if (!product) {
      Alert.alert(t('productNotFound'), t('noProductMatchesBarcode'));
      return;
    }

    addToCart(product);
  }

  if (scannerOpen) {
    return (
      <BarcodeScannerView
        title={t('scanProductToSell')}
        onCancel={() => setScannerOpen(false)}
        onScanned={handleBarcode}
      />
    );
  }

  return (
    <MobileShell>
      <AppHeader title={t('sales')} left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View>
            <ThemedText style={styles.summaryLabel}>{t('salesRevenue')}</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatMoney(visibleSalesTotals.totalSales)}</ThemedText>
          </View>
          {!salesperson ? (
            <View style={styles.summarySide}>
              <ThemedText style={styles.summaryLabel}>{t('profit')}</ThemedText>
              <ThemedText style={styles.profit}>{formatMoney(visibleSalesTotals.totalProfit)}</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <AuthInput
              label={t('browseProducts')}
              onChangeText={setSearch}
              placeholder={t('searchProduct')}
              value={search}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={openScanner} style={styles.scanButton}>
            <ScanLine color="#ffffff" size={24} strokeWidth={2.4} />
          </Pressable>
        </View>
        {productsError ? (
          <ThemedText style={styles.errorText}>{t('productFirebaseError')}: {productsError}</ThemedText>
        ) : null}

        {lastScannedProduct ? (
          <View style={styles.scannedPanel}>
            <ThemedText style={styles.panelTitle}>{t('scanProductToSell')}</ThemedText>
            <ThemedText style={styles.productName}>{lastScannedProduct.name}</ThemedText>
            <ThemedText style={styles.productMeta}>{t('barcode')}: {lastScannedProduct.barcode}</ThemedText>
            <ThemedText style={styles.productMeta}>{t('sku')}: {lastScannedProduct.sku}</ThemedText>
            <ThemedText style={styles.productMeta}>{t('stock')}: {lastScannedProduct.stock}</ThemedText>
            <ThemedText style={styles.price}>
              {t('sales')}: {formatMoney(lastScannedProduct.price)}
            </ThemedText>
            {!salesperson ? (
              <ThemedText style={styles.productMeta}>
                {t('profitPerItem')}: {formatMoney(lastScannedProduct.price - lastScannedProduct.costPrice)}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        <View style={styles.checkoutPanel}>
          <View style={styles.checkoutHeader}>
            <View style={styles.checkoutTitleRow}>
              <ShoppingCart color="#0878ff" size={20} strokeWidth={2.4} />
              <ThemedText style={styles.panelTitle}>{t('checkout')}</ThemedText>
            </View>
            <ThemedText style={styles.productMeta}>{cartItems.length} {t('products')}</ThemedText>
          </View>
          {cartItems.length ? (
            <View style={styles.cartList}>
              {cartItems.map(({ product, quantity }) => (
                <View key={product.id} style={styles.cartRow}>
                  <View style={styles.productInfo}>
                    <ThemedText style={styles.productName}>{product.name}</ThemedText>
                    <ThemedText style={styles.productMeta}>
                      {formatMoney(product.price)} x {quantity}
                    </ThemedText>
                  </View>
                  <View style={styles.quantityControls}>
                    <Pressable
                      accessibilityLabel={t('cartQuantityCannotExceedStock')}
                      accessibilityRole="button"
                      onPress={() => updateCartQuantity(product, -1)}
                      style={styles.quantityButton}>
                      <Minus color="#0878ff" size={16} strokeWidth={2.6} />
                    </Pressable>
                    <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
                    <Pressable
                      accessibilityLabel={t('stock')}
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
            <ThemedText style={styles.productMeta}>{t('scanOrBrowseProductsToAdd')}</ThemedText>
          )}
          <AuthInput
            label={t('discountAmount')}
            keyboardType="numeric"
            onChangeText={setDiscountAmount}
            placeholder="0.00"
            value={discountAmount}
          />
          <View style={styles.checkoutTotals}>
            <ThemedText style={styles.productMeta}>{t('subtotal')}: {formatMoney(cartTotal)}</ThemedText>
            <ThemedText style={styles.productMeta}>{t('discount')}: {formatMoney(safeDiscount)}</ThemedText>
            <ThemedText style={styles.totalText}>{t('total')}: {formatMoney(payableTotal)}</ThemedText>
            {!salesperson ? (
              <ThemedText style={styles.profitText}>{t('profit')}: {formatMoney(payableProfit)}</ThemedText>
            ) : null}
          </View>
          <AuthButton loading={checkingOut} title={t('checkout')} onPress={checkout} />
        </View>

        <View style={styles.list}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productMeta}>{t('barcode')}: {product.barcode}</ThemedText>
                <ThemedText style={styles.productMeta}>{t('stock')}: {product.stock}</ThemedText>
              </View>
              <View style={styles.productAction}>
                <ThemedText style={styles.price}>{formatMoney(product.price)}</ThemedText>
                <AuthButton
                  disabled={product.stock <= 0}
                  title={t('sell')}
                  onPress={() => addToCart(product)}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="sales" />
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
  errorText: {
    color: '#d92d20',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  price: {
    color: '#101828',
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
});
