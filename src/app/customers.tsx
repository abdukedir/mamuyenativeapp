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
import { addCustomer, subscribeToCustomers } from '@/services/businessService';
import type { Customer } from '@/types/business';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  totalPurchases: string;
};

export default function CustomersScreen() {
  const t = useTranslation();
  const { userProfile } = useAuth();
  const formatMoney = useMoneyFormatter();
  const { items, loading, error } = useBusinessCollection<Customer>(subscribeToCustomers);
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<CustomerForm>({
    defaultValues: { name: '', phone: '', email: '', totalPurchases: '0' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!userProfile) return;

    confirmAction({
      title: t('saveCustomerQuestion'),
      message: `${values.name}\n${values.phone}\n\nThis will create the customer in Firebase.`,
      confirmText: t('save'),
      onConfirm: async () => {
        try {
          await addCustomer({
            name: values.name,
            phone: values.phone,
            email: values.email.trim() || null,
            totalPurchases: Number(values.totalPurchases) || 0,
          }, userProfile);
          reset({ name: '', phone: '', email: '', totalPurchases: '0' });
          Alert.alert(t('customerSaved'), t('customerSavedMessage'));
        } catch (submitError) {
          Alert.alert(t('customerFailed'), getFirebaseErrorMessage(submitError));
        }
      },
    });
  });

  return (
    <MobileShell>
      <AppHeader title={t('customers')} left="back" right="none" onLeftPress={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.form}>
            <ThemedText style={styles.heading}>{t('registerCustomer')}</ThemedText>
            <Controller control={control} name="name" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('customerName')} onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="phone" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('phoneNumber')} keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="email" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('emailOptional')} keyboardType="email-address" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="totalPurchases" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('openingPurchaseTotal')} keyboardType="decimal-pad" onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <AuthButton title={t('saveCustomer')} loading={isSubmitting} onPress={onSubmit} />
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          </View>
        }
        ListEmptyComponent={!loading ? <ThemedText style={styles.empty}>{t('customersWillAppearHere')}</ThemedText> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText style={styles.title}>{item.name}</ThemedText>
            <ThemedText style={styles.meta}>{item.phone}</ThemedText>
            <ThemedText style={styles.meta}>{item.email ?? t('noEmail')}</ThemedText>
            <ThemedText style={styles.meta}>{t('purchasesLabel')}: {formatMoney(item.totalPurchases)}</ThemedText>
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
