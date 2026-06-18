import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronRight, Pencil } from 'lucide-react-native';
import { useState } from 'react';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { ProductArtwork } from '@/components/inventory/product-artwork';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { useTheme } from '@/hooks/use-theme';
import { sellProduct, updateProductDetails, updateProductStock } from '@/services/productService';
import { getProductProfit, type Product } from '@/types/product';
import { canAccessAllApp } from '@/types/user';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { productSchema, type ProductFormInput } from '@/validations/productSchemas';

export function ProductRow({ product, compact = false }: { product: Product; compact?: boolean }) {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { categories } = useCategories();
  const t = useTranslation();
  const formatMoney = useMoneyFormatter();
  const [stockBusy, setStockBusy] = useState(false);
  const [sellBusy, setSellBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormInput>(() => getInitialForm(product));
  const canSell = canAccessAllApp(userProfile);
  const canManageStock = canAccessAllApp(userProfile);

  function getInitialForm(item: Product): ProductFormInput {
    return {
      name: item.name,
      sku: item.sku,
      categoryId: item.categoryId,
      barcode: item.barcode,
      costPrice: item.costPrice,
      price: item.price,
      stock: item.stock,
      minimumStockLevel: item.minimumStockLevel,
      criticalStockLevel: item.criticalStockLevel,
      description: item.description ?? '',
    };
  }

  function updateForm<Key extends keyof ProductFormInput>(key: Key, value: ProductFormInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openEdit() {
    setForm(getInitialForm(product));
    setEditError(null);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), 'Please sign in before editing products.');
      return;
    }

    if (!canManageStock) {
      Alert.alert(t('permissionRequired'), 'Only active registered users can edit products.');
      return;
    }

    const parsed = productSchema.safeParse(form);

    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? 'Check the product fields.');
      return;
    }

    const category = categories.find((item) => item.id === parsed.data.categoryId);

    if (!category) {
      setEditError(t('category'));
      return;
    }

    try {
      setEditBusy(true);
      setEditError(null);
      await updateProductDetails(product, parsed.data, category, userProfile);
      setEditOpen(false);
      Alert.alert(t('createProduct'), 'Product details were updated in Firebase.');
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setEditError(message);
      Alert.alert(t('createProduct'), message);
    } finally {
      setEditBusy(false);
    }
  }

  async function handleSell() {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), t('pleaseSignInBeforeSelling'));
      return;
    }

    confirmAction({
      title: 'Sell product?',
      message: `${product.name}\nPrice: ${formatMoney(product.price)}\n\nThis will create a Firebase sale and reduce stock by 1.`,
      confirmText: 'Sell',
      onConfirm: async () => {
        try {
          setSellBusy(true);
          await sellProduct(product, userProfile);
          Alert.alert(t('checkoutComplete'), t('saleStockTotalUpdated'));
        } catch (error) {
          Alert.alert(t('checkoutFailed'), getFirebaseErrorMessage(error));
        } finally {
          setSellBusy(false);
        }
      },
    });
  }

  async function handleStockChange(delta: number) {
    const nextStock = product.stock + delta;

    if (nextStock < 0) {
      Alert.alert(t('stock'), 'Stock cannot go below zero.');
      return;
    }

    if (!userProfile) {
      Alert.alert(t('signInRequired'), 'Please sign in before updating stock.');
      return;
    }

    confirmAction({
      title: 'Update stock?',
      message: `${product.name}\nCurrent stock: ${product.stock}\nNew stock: ${nextStock}\n\nThis will update Firebase inventory.`,
      confirmText: 'Update',
      onConfirm: async () => {
        try {
          setStockBusy(true);
          await updateProductStock(product, nextStock, userProfile);
          Alert.alert(t('stock'), 'Inventory stock was updated in Firebase.');
        } catch (error) {
          Alert.alert(t('stock'), getFirebaseErrorMessage(error));
        } finally {
          setStockBusy(false);
        }
      },
    });
  }

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Modal animationType="slide" onRequestClose={() => setEditOpen(false)} visible={editOpen}>
        <ScrollView bounces={false} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{t('createProduct')}</ThemedText>
            <Pressable accessibilityRole="button" onPress={() => setEditOpen(false)} style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>{t('close')}</ThemedText>
            </Pressable>
          </View>
          <AuthInput label={t('productName')} onChangeText={(value) => updateForm('name', value)} value={String(form.name)} />
          <AuthInput label={t('sku')} onChangeText={(value) => updateForm('sku', value)} value={String(form.sku)} />
          <AuthInput label={t('barcode')} onChangeText={(value) => updateForm('barcode', value)} value={String(form.barcode)} />
          <View style={styles.categoryWrap}>
            <ThemedText style={styles.categoryLabel}>{t('category')}</ThemedText>
            <View style={styles.categoryChips}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() => updateForm('categoryId', category.id)}
                  style={[
                    styles.categoryChip,
                    form.categoryId === category.id && styles.categoryChipActive,
                  ]}>
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      form.categoryId === category.id && styles.categoryChipTextActive,
                    ]}>
                    {category.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.formGrid}>
            <AuthInput
              label={t('costPrice')}
              keyboardType="numeric"
              onChangeText={(value) => updateForm('costPrice', value)}
              value={String(form.costPrice)}
            />
            <AuthInput
              label={t('sellingPrice')}
              keyboardType="numeric"
              onChangeText={(value) => updateForm('price', value)}
              value={String(form.price)}
            />
            <AuthInput
              label={t('stock')}
              keyboardType="numeric"
              onChangeText={(value) => updateForm('stock', value)}
              value={String(form.stock)}
            />
            <AuthInput
              label={t('minimumStockLevel')}
              keyboardType="numeric"
              onChangeText={(value) => updateForm('minimumStockLevel', value)}
              value={String(form.minimumStockLevel)}
            />
            <AuthInput
              label={t('criticalStockAlert')}
              keyboardType="numeric"
              onChangeText={(value) => updateForm('criticalStockLevel', value)}
              value={String(form.criticalStockLevel)}
            />
          </View>
          <AuthInput
            label={t('description')}
            multiline
            onChangeText={(value) => updateForm('description', value)}
            style={styles.descriptionInput}
            value={String(form.description ?? '')}
          />
          {editError ? <ThemedText style={styles.errorText}>{editError}</ThemedText> : null}
          <AuthButton loading={editBusy} title={t('save')} onPress={saveEdit} />
        </ScrollView>
      </Modal>
      <ProductArtwork
        category={product.categoryId}
        accent={product.categoryAccent}
        size={compact ? 'small' : 'medium'}
        imageUri={product.imageUri}
      />
      <View style={styles.info}>
        <ThemedText type="smallBold" style={styles.name}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" style={styles.sku}>
          {t('sku')}: {product.sku}
        </ThemedText>
        <ThemedText type="small" style={styles.sku}>
          {t('barcode')}: {product.barcode}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.stock}>
          {t('inStock')}: {product.stock}
        </ThemedText>
      </View>
      <View style={styles.trailing}>
        <ThemedText type="smallBold" style={styles.price}>
          {formatMoney(product.price)}
        </ThemedText>
        <ThemedText type="small" style={styles.profit}>
          {t('profit')}: {formatMoney(getProductProfit(product))}
        </ThemedText>
        <ChevronRight color={theme.text} size={18} strokeWidth={2.4} />
      </View>
      {(canSell || canManageStock) && (
        <View style={styles.actions}>
          {canSell ? (
            <Pressable
              accessibilityRole="button"
              disabled={product.stock <= 0 || sellBusy || stockBusy}
              onPress={handleSell}
              style={[styles.actionButton, (product.stock <= 0 || sellBusy || stockBusy) && styles.actionButtonDisabled]}>
              <ThemedText style={styles.actionText}>{sellBusy ? `${t('sell')}...` : t('sell')}</ThemedText>
            </Pressable>
          ) : null}
          {canManageStock ? (
            <View style={styles.stockControls}>
              <Pressable
                accessibilityLabel="Edit product"
                accessibilityRole="button"
                disabled={editBusy || stockBusy || sellBusy}
                onPress={openEdit}
                style={[styles.editButton, (editBusy || stockBusy || sellBusy) && styles.stockButtonDisabled]}>
                <Pencil color="#0878ff" size={15} strokeWidth={2.6} />
                <ThemedText style={styles.editButtonText}>{t('edit')}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityLabel="Decrease stock"
                accessibilityRole="button"
                disabled={stockBusy}
                onPress={() => handleStockChange(-1)}
                style={[styles.stockButton, stockBusy && styles.stockButtonDisabled]}>
                <ThemedText style={styles.stockButtonText}>{stockBusy ? '...' : '-'}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityLabel="Increase stock"
                accessibilityRole="button"
                disabled={stockBusy}
                onPress={() => handleStockChange(1)}
                style={[styles.stockButton, stockBusy && styles.stockButtonDisabled]}>
                <ThemedText style={styles.stockButtonText}>{stockBusy ? '...' : '+'}</ThemedText>
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
    flexWrap: 'wrap',
    gap: 8,
  },
  editButton: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#f5f9ff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  editButtonText: {
    color: '#0878ff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
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
  stockButtonDisabled: {
    opacity: 0.55,
  },
  stockButtonText: {
    color: '#0878ff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  modalContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 34,
    gap: 12,
    backgroundColor: '#f6f8fb',
  },
  modalHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    color: '#101828',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0878ff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  categoryWrap: {
    gap: 8,
  },
  categoryLabel: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: '#0878ff',
    backgroundColor: '#eaf2ff',
  },
  categoryChipText: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: '#0878ff',
  },
  formGrid: {
    gap: 10,
  },
  descriptionInput: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#d92d20',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
});
