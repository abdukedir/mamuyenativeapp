import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessCollection } from '@/hooks/useBusinessCollection';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { addPurchase, subscribeToPurchases } from '@/services/businessService';
import type { Purchase } from '@/types/business';
import { canAccessAllApp } from '@/types/user';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

type PurchaseForm = {
  supplierName: string;
  totalAmount: string;
  paidAmount: string;
};

export default function PurchasesScreen() {
  const t = useTranslation();
  const { userProfile } = useAuth();
  const formatMoney = useMoneyFormatter();
  const { items, loading, error } = useBusinessCollection<Purchase>(subscribeToPurchases);
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<PurchaseForm>({
    defaultValues: { supplierName: '', totalAmount: '', paidAmount: '' },
  });

  const canManage = canAccessAllApp(userProfile);

  const onSubmit = handleSubmit(async (values) => {
    if (!userProfile || !canManage) {
      Alert.alert(t('permissionRequired'), t('onlyAdminsManagersPurchases'));
      return;
    }

    const totalAmount = Number(values.totalAmount) || 0;
    const paidAmount = Number(values.paidAmount) || 0;

    confirmAction({
      title: t('savePurchaseQuestion'),
      message: `${values.supplierName}\n${t('total')}: ${formatMoney(totalAmount)}\n${t('paid')}: ${formatMoney(paidAmount)}\n\n${t('savePurchaseMessage')}`,
      confirmText: t('save'),
      onConfirm: async () => {
        try {
          await addPurchase({
            supplierId: null,
            supplierName: values.supplierName,
            totalAmount,
            paidAmount,
          }, userProfile);
          reset({ supplierName: '', totalAmount: '', paidAmount: '' });
          Alert.alert(t('purchaseSaved'), t('purchaseSavedMessage'));
        } catch (submitError) {
          Alert.alert(t('purchaseFailed'), getFirebaseErrorMessage(submitError));
        }
      },
    });
  });

  return (
    <MobileShell>
      <AppHeader title={t('purchases')} left="back" right="none" onLeftPress={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.form}>
            <ThemedText style={styles.heading}>{t('registerPurchase')}</ThemedText>
            <Controller control={control} name="supplierName" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('supplierName')} editable={canManage} onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="totalAmount" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('totalAmount')} keyboardType="decimal-pad" editable={canManage} onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="paidAmount" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('paidAmount')} keyboardType="decimal-pad" editable={canManage} onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <AuthButton title={t('savePurchase')} loading={isSubmitting} disabled={!canManage} onPress={onSubmit} />
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          </View>
        }
        ListEmptyComponent={!loading ? <ThemedText style={styles.empty}>{t('noPurchasesRecordedYet')}</ThemedText> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText style={styles.title}>{item.supplierName}</ThemedText>
            <ThemedText style={styles.meta}>{t('total')}: {formatMoney(item.totalAmount)}</ThemedText>
            <ThemedText style={styles.meta}>{t('paid')}: {formatMoney(item.paidAmount)}</ThemedText>
            <ThemedText style={styles.meta}>{t('outstanding')}: {formatMoney(item.outstandingBalance)}</ThemedText>
          </View>
        )}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 12 },
  form: { gap: 12 },
  heading: { color: '#101828', fontSize: 16, fontWeight: '900' },
  empty: { color: '#667085', textAlign: 'center', padding: 18 },
  error: { color: '#d92d20', fontSize: 13, fontWeight: '800' },
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 5 },
  title: { color: '#101828', fontSize: 15, fontWeight: '900' },
  meta: { color: '#667085', fontSize: 13, fontWeight: '700' },
});
