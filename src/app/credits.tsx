import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessCollection } from '@/hooks/useBusinessCollection';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { addCredit, subscribeToCredits } from '@/services/businessService';
import type { Credit } from '@/types/business';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

const creditSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required'),
  phone: z.string().trim().min(7, 'Phone number is required'),
  productPurchased: z.string().trim().min(2, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity is required'),
  amount: z.coerce.number().min(0.01, 'Amount is required'),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative'),
  dueDate: z.string().trim().min(4, 'Due date is required'),
});

type CreditFormInput = z.input<typeof creditSchema>;
type CreditFormValues = z.output<typeof creditSchema>;

export default function CreditsScreen() {
  const t = useTranslation();
  const { userProfile } = useAuth();
  const formatMoney = useMoneyFormatter();
  const { items } = useBusinessCollection<Credit>(subscribeToCredits);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreditFormInput, unknown, CreditFormValues>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      productPurchased: '',
      quantity: 1,
      amount: 0,
      paidAmount: 0,
      dueDate: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!userProfile) return;

    confirmAction({
      title: t('registerCreditQuestion'),
      message: `${values.customerName}\n${t('amount')}: ${formatMoney(values.amount)}\n${t('paid')}: ${formatMoney(values.paidAmount)}\n\n${t('customerCreditSaveMessage')}`,
      confirmText: t('registerCredit'),
      onConfirm: async () => {
        try {
          await addCredit(values, userProfile);
          reset();
          Alert.alert(t('creditRegistered'), t('creditRegisteredMessage'));
        } catch (error) {
          Alert.alert(t('creditFailed'), getFirebaseErrorMessage(error));
        }
      },
    });
  });

  return (
    <MobileShell>
      <AppHeader title={t('credits')} left="back" right="none" onLeftPress={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.form}>
            {(['customerName', 'phone', 'productPurchased', 'dueDate'] as const).map((name) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field: { onBlur, onChange, value } }) => (
                  <AuthInput
                    error={errors[name]?.message}
                    label={{
                      customerName: t('customerName'),
                      phone: t('phoneNumber'),
                      productPurchased: t('productPurchased'),
                      dueDate: t('dueDate'),
                    }[name]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value)}
                  />
                )}
              />
            ))}
            <View style={styles.row}>
              {(['quantity', 'amount', 'paidAmount'] as const).map((name) => (
                <View key={name} style={styles.flex}>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field: { onBlur, onChange, value } }) => (
                      <AuthInput
                        error={errors[name]?.message}
                        keyboardType="decimal-pad"
                        label={{ quantity: t('quantity'), amount: t('amount'), paidAmount: t('paid') }[name]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={String(value)}
                      />
                    )}
                  />
                </View>
              ))}
            </View>
            <AuthButton title={t('registerCredit')} loading={isSubmitting} onPress={onSubmit} />
            <ThemedText style={styles.sectionTitle}>{t('creditRecords')}</ThemedText>
          </View>
        }
        ListEmptyComponent={<ThemedText style={styles.empty}>{t('noCreditsYet')}</ThemedText>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText style={styles.title}>{item.customerName}</ThemedText>
            <ThemedText style={styles.meta}>{item.productPurchased} - {t('quantity')} {item.quantity}</ThemedText>
            <ThemedText style={styles.meta}>{t('remaining')}: {formatMoney(item.remainingBalance)}</ThemedText>
            <ThemedText style={styles.status}>{item.status.replace('_', ' ')}</ThemedText>
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
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  sectionTitle: { color: '#101828', fontSize: 16, fontWeight: '900', marginTop: 8 },
  empty: { color: '#667085', textAlign: 'center', padding: 18 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 4 },
  title: { color: '#101828', fontSize: 15, fontWeight: '900' },
  meta: { color: '#667085', fontSize: 13, fontWeight: '600' },
  status: { color: '#0878ff', fontSize: 13, fontWeight: '900', textTransform: 'capitalize' },
});
