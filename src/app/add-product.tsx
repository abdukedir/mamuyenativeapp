import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { BarcodeScannerView } from '@/components/inventory/barcode-scanner-view';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { createCategory } from '@/services/categoryService';
import { createProductWithCategory } from '@/services/productService';
import { categoryAccentOptions } from '@/types/product';
import { canAccessAllApp } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  categorySchema,
  productSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/validations/productSchemas';

export default function AddProductScreen() {
  const { userProfile } = useAuth();
  const t = useTranslation();
  const formatMoney = useMoneyFormatter();
  const { categories, error: categoriesError, loading: categoriesLoading } = useCategories();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryAccent, setCategoryAccent] = useState(categoryAccentOptions[0]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      barcode: '',
      costPrice: 0,
      price: 0,
      stock: 0,
      minimumStockLevel: 5,
      criticalStockLevel: 2,
      description: '',
    },
  });
  const selectedCategoryId = useWatch({ control, name: 'categoryId' });
  const costPrice = Number(useWatch({ control, name: 'costPrice' }) ?? 0);
  const sellingPrice = Number(useWatch({ control, name: 'price' }) ?? 0);

  const canCreate = canAccessAllApp(userProfile);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const profit = useMemo(() => sellingPrice - costPrice, [costPrice, sellingPrice]);

  useEffect(() => {
    if (!selectedCategoryId && categories[0]) {
      setValue('categoryId', categories[0].id, { shouldValidate: true });
    }
  }, [categories, selectedCategoryId, setValue]);

  async function handleCreateCategory() {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), 'Please sign in before creating categories.');
      return;
    }

    if (!canCreate) {
      Alert.alert(t('permissionRequired'), 'Only active registered users can create categories.');
      return;
    }

    const parsed = categorySchema.safeParse({ name: categoryName, accent: categoryAccent });

    if (!parsed.success) {
      Alert.alert(t('category'), parsed.error.issues[0]?.message ?? t('category'));
      return;
    }

    setCreatingCategory(true);

    try {
      const categoryId = await createCategory(parsed.data, userProfile);
      setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true });
      setCategoryName('');
      Alert.alert(t('createCategory'), 'The category was saved to Firebase.');
    } catch (error) {
      Alert.alert(t('createCategory'), getFirebaseErrorMessage(error));
    } finally {
      setCreatingCategory(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), 'Please sign in before creating products.');
      return;
    }

    if (!canCreate) {
      Alert.alert(t('permissionRequired'), 'Only active registered users can create products.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert(t('category'), 'Create and choose a category before creating products.');
      return;
    }

    try {
      await createProductWithCategory(values, selectedCategory, userProfile);
      reset();
      Alert.alert(t('createProduct'), `${values.name} is now saved in Firebase.`);
      router.replace('/explore');
    } catch (error) {
      Alert.alert(t('createProduct'), getFirebaseErrorMessage(error));
    }
  });

  return (
    <MobileShell>
      <Modal
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
        presentationStyle="fullScreen"
        visible={scannerOpen}>
        <BarcodeScannerView
          title={t('scanProductToSell')}
          onCancel={() => setScannerOpen(false)}
          onScanned={(value) => {
            setValue('barcode', value.trim(), {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            setScannerOpen(false);
          }}
        />
      </Modal>
      <AppHeader title={t('addProduct')} left="back" onLeftPress={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        {!canCreate ? (
          <View style={styles.notice}>
            <ThemedText style={styles.noticeTitle}>{t('productCreationManagersOnly')}</ThemedText>
            <ThemedText style={styles.noticeCopy}>
              {t('salesCanBrowseOnly')}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('createCategoryStep')}</ThemedText>
          {categoriesError ? (
            <ThemedText style={styles.errorText}>{t('categoryFirebaseError')}: {categoriesError}</ThemedText>
          ) : null}
          <AuthInput
            label={t('categoryName')}
            onChangeText={setCategoryName}
            placeholder="Example: Electronics"
            value={categoryName}
          />
          <View style={styles.swatches}>
            {categoryAccentOptions.map((accent) => (
              <Pressable
                key={accent}
                accessibilityLabel={`Category color ${accent}`}
                accessibilityRole="button"
                onPress={() => setCategoryAccent(accent)}
                style={[
                  styles.swatch,
                  { backgroundColor: accent },
                  categoryAccent === accent && styles.swatchActive,
                ]}
              />
            ))}
          </View>
          <AuthButton
            loading={creatingCategory}
            title={t('createCategory')}
            variant="secondary"
            onPress={handleCreateCategory}
          />
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.sectionTitle}>{t('createProductStep')}</ThemedText>
          <Controller
            control={control}
            name="name"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                autoCapitalize="words"
                error={errors.name?.message}
                label={t('productName')}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('productName')}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="sku"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                autoCapitalize="characters"
                error={errors.sku?.message}
                label={t('sku')}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="TV-43-SAM"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.categoryWrap}>
                <ThemedText style={styles.label}>{t('category')}</ThemedText>
                <View style={styles.categories}>
                  {categories.map((category) => (
                    <CategoryOption
                      key={category.id}
                      active={value === category.id}
                      label={category.name}
                      onPress={() => onChange(category.id)}
                    />
                  ))}
                </View>
                {!categories.length && !categoriesLoading ? (
                  <ThemedText style={styles.errorText}>{t('createCategoryFirst')}</ThemedText>
                ) : null}
                {errors.categoryId?.message ? (
                  <ThemedText style={styles.errorText}>{errors.categoryId.message}</ThemedText>
                ) : null}
              </View>
            )}
          />
          <Controller
            control={control}
            name="barcode"
            render={({ field: { onBlur, onChange, value } }) => (
              <View style={styles.scanWrap}>
                <View style={styles.scanInput}>
                  <AuthInput
                    error={errors.barcode?.message}
                    label={t('barcode')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder={t('scanOrEnterBarcode')}
                    value={value}
                  />
                </View>
                <AuthButton title={t('scan')} variant="secondary" onPress={() => setScannerOpen(true)} />
              </View>
            )}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="costPrice"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors.costPrice?.message}
                    keyboardType="decimal-pad"
                    label={t('costPrice')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="120.00"
                    value={String(value)}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="price"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors.price?.message}
                    keyboardType="decimal-pad"
                    label={t('sellingPrice')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="299.00"
                    value={String(value)}
                  />
                )}
              />
            </View>
          </View>
          <View style={styles.profitBox}>
            <ThemedText style={styles.profitText}>{t('estimatedProfit')}: {formatMoney(profit)}</ThemedText>
          </View>
          <View style={styles.row}>
            <View style={styles.fullWidth}>
              <Controller
                control={control}
                name="stock"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors.stock?.message}
                    keyboardType="number-pad"
                    label={t('stock')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="12"
                    value={String(value)}
                  />
                )}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="minimumStockLevel"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors.minimumStockLevel?.message}
                    keyboardType="number-pad"
                    label={t('minimumStockLevel')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="5"
                    value={String(value)}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="criticalStockLevel"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors.criticalStockLevel?.message}
                    keyboardType="number-pad"
                    label={t('criticalStockAlert')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="2"
                    value={String(value)}
                  />
                )}
              />
            </View>
          </View>
          <Controller
            control={control}
            name="description"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                error={errors.description?.message}
                label={t('description')}
                multiline
                numberOfLines={4}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('optionalDetails')}
                style={styles.textArea}
                value={value}
              />
            )}
          />
          <AuthButton
            loading={isSubmitting}
            title={t('createProduct')}
            onPress={onSubmit}
          />
        </View>
      </ScrollView>
      <BottomNav active="products" />
    </MobileShell>
  );
}

function CategoryOption({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label} category`}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.categoryChip, active && styles.categoryChipActive]}>
      <ThemedText style={[styles.categoryText, active && styles.categoryTextActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 14,
    paddingBottom: 22,
    gap: 16,
  },
  notice: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fedf89',
    backgroundColor: '#fffaeb',
    padding: 14,
    gap: 4,
  },
  noticeTitle: {
    color: '#93370d',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  noticeCopy: {
    color: '#b54708',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  form: {
    gap: 15,
  },
  section: {
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  sectionTitle: {
    color: '#101828',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: '#101828',
  },
  categoryWrap: {
    gap: 8,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: '#0878ff',
    backgroundColor: '#eaf2ff',
  },
  categoryText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  categoryTextActive: {
    color: '#0878ff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  scanWrap: {
    gap: 10,
  },
  scanInput: {
    flex: 1,
  },
  half: {
    flex: 1,
  },
  fullWidth: {
    flex: 1,
  },
  profitBox: {
    borderRadius: 10,
    backgroundColor: '#ecfdf3',
    padding: 12,
  },
  profitText: {
    color: '#027a48',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  textArea: {
    minHeight: 104,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#d92d20',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
