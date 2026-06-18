import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessCollection } from '@/hooks/useBusinessCollection';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { addSupplier, deleteSupplier, subscribeToSuppliers } from '@/services/businessService';
import type { Supplier } from '@/types/business';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name is required'),
  phone: z.string().trim().min(7, 'Phone number is required'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  productsSupplied: z.string().trim().optional(),
  outstandingBalance: z.coerce.number().min(0, 'Balance cannot be negative'),
});

type SupplierInput = z.input<typeof supplierSchema>;
type SupplierValues = z.output<typeof supplierSchema>;

export default function SuppliersScreen() {
  const t = useTranslation();
  const { userProfile } = useAuth();
  const formatMoney = useMoneyFormatter();
  const { items } = useBusinessCollection<Supplier>(subscribeToSuppliers);
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierInput, unknown, SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', productsSupplied: '', outstandingBalance: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!userProfile) return;

    confirmAction({
      title: t('addSupplierQuestion'),
      message: `${values.name}\n${values.phone}\n${t('outstanding')}: ${formatMoney(values.outstandingBalance)}\n\n${t('supplierSaveMessage')}`,
      confirmText: t('add'),
      onConfirm: async () => {
        try {
          await addSupplier({
            name: values.name,
            phone: values.phone,
            email: values.email || null,
            address: values.address || null,
            productsSupplied: values.productsSupplied ? values.productsSupplied.split(',').map((item) => item.trim()) : [],
            outstandingBalance: values.outstandingBalance,
          }, userProfile);
          reset();
          Alert.alert(t('supplierAdded'), t('supplierSavedMessage'));
        } catch (error) {
          Alert.alert(t('supplierFailed'), getFirebaseErrorMessage(error));
        }
      },
    });
  });

  async function removeSupplier(item: Supplier) {
    if (!userProfile) return;
    confirmAction({
      title: t('deleteSupplierQuestion'),
      message: `${item.name}\n\n${t('supplierRemoveMessage')}`,
      confirmText: t('delete'),
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteSupplier(item.id, userProfile);
          Alert.alert(t('supplierDeleted'), t('supplierDeletedMessage'));
        } catch (error) {
          Alert.alert(t('deleteFailed'), getFirebaseErrorMessage(error));
        }
      },
    });
  }

  return (
    <MobileShell>
      <AppHeader title={t('suppliers')} left="back" right="none" onLeftPress={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.form}>
            {(['name', 'phone', 'email', 'address', 'productsSupplied', 'outstandingBalance'] as const).map((name) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors[name]?.message}
                    keyboardType={name === 'outstandingBalance' ? 'decimal-pad' : 'default'}
                    label={{
                      name: t('supplierName'),
                      phone: t('phone'),
                      email: t('email'),
                      address: t('address'),
                      productsSupplied: t('productsSupplied'),
                      outstandingBalance: t('outstanding'),
                    }[name]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? '')}
                  />
                )}
              />
            ))}
            <AuthButton title={t('addSupplier')} loading={isSubmitting} onPress={onSubmit} />
            <ThemedText style={styles.sectionTitle}>{t('supplierProfiles')}</ThemedText>
          </View>
        }
        ListEmptyComponent={<ThemedText style={styles.empty}>{t('noSuppliersYet')}</ThemedText>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <ThemedText style={styles.title}>{item.name}</ThemedText>
                <ThemedText style={styles.meta}>{item.phone}</ThemedText>
                <ThemedText style={styles.meta}>{t('products')}: {item.productsSupplied.join(', ') || t('none')}</ThemedText>
                <ThemedText style={styles.meta}>{t('outstanding')}: {formatMoney(item.outstandingBalance)}</ThemedText>
              </View>
              <Pressable onPress={() => removeSupplier(item)} style={styles.deleteButton}>
                <ThemedText style={styles.deleteText}>{t('delete')}</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={styles.content}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 12 },
  form: { gap: 12 },
  sectionTitle: { color: '#101828', fontSize: 16, fontWeight: '900', marginTop: 8 },
  empty: { color: '#667085', textAlign: 'center', padding: 18 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  flex: { flex: 1, gap: 4 },
  title: { color: '#101828', fontSize: 15, fontWeight: '900' },
  meta: { color: '#667085', fontSize: 13, fontWeight: '600' },
  deleteButton: { borderRadius: 8, backgroundColor: '#feecee', paddingHorizontal: 10, paddingVertical: 8 },
  deleteText: { color: '#d92d20', fontSize: 12, fontWeight: '900' },
});
