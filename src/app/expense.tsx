import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { useProducts } from '@/hooks/useProducts';
import { createExpense } from '@/services/activityService';
import { isSalesperson } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

const expenseSchema = z.object({
  title: z.string().trim().min(2, 'Expense title is required').max(80, 'Title is too long'),
  amount: z.coerce.number({ error: 'Enter a valid amount' }).min(0.01, 'Amount must be greater than zero'),
  note: z.string().trim().max(300, 'Note is too long').optional(),
});

type ExpenseFormInput = z.input<typeof expenseSchema>;
type ExpenseFormValues = z.output<typeof expenseSchema>;

export default function ExpenseScreen() {
  const { userProfile } = useAuth();
  const t = useTranslation();
  const formatMoney = useMoneyFormatter();
  const { expenses } = useActivities();
  const { stats } = useProducts();
  const salesperson = isSalesperson(userProfile);
  const visibleExpenses = salesperson && userProfile
    ? expenses.filter((expense) => expense.createdBy === userProfile.uid)
    : expenses;
  const visibleExpenseTotal = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { title: '', amount: 0, note: '' },
  });

  const submitExpense = async (values: ExpenseFormValues) => {
    if (!userProfile) {
      Alert.alert(t('signInRequired'), t('pleaseSignInBeforeExpenses'));
      return;
    }

    try {
      await createExpense(values, userProfile);
      reset();
      Alert.alert(t('expenseRegistered'), `${values.title} (${formatMoney(values.amount)}) ${t('expenseSavedMessage')}`);
    } catch (error) {
      Alert.alert(t('expenseFailed'), getFirebaseErrorMessage(error));
    }
  };

  return (
    <MobileShell>
      <AppHeader title={t('expense')} left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <ThemedText style={styles.summaryLabel}>
            {salesperson ? t('approvedExpenses') : t('businessTotalAfterExpenses')}
          </ThemedText>
          <ThemedText style={styles.summaryValue}>
            {formatMoney(salesperson ? visibleExpenseTotal : stats.totalValue)}
          </ThemedText>
          <ThemedText style={styles.summaryMeta}>{t('approvedExpenses')}: {formatMoney(visibleExpenseTotal)}</ThemedText>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                error={errors.title?.message}
                label={t('expenseTitle')}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Transport, rent, utility"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="amount"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                error={errors.amount?.message}
                keyboardType="decimal-pad"
                label={t('amount')}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="0.00"
                value={String(value)}
              />
            )}
          />
          <Controller
            control={control}
            name="note"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                error={errors.note?.message}
                label={t('note')}
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('optionalDetails')}
                style={styles.textArea}
                value={value}
              />
            )}
          />
          <AuthButton title={t('expense')} loading={isSubmitting} onPress={handleSubmit(submitExpense)} />
        </View>

        <View style={styles.list}>
          {visibleExpenses.slice(0, 8).map((expense) => (
            <View key={expense.id} style={styles.row}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowTitle}>{expense.title}</ThemedText>
                <ThemedText style={styles.rowMeta}>{expense.createdByName}</ThemedText>
              </View>
              <ThemedText style={styles.amount}>{formatMoney(expense.amount)}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active="expenses" />
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
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 16,
    gap: 4,
  },
  summaryLabel: {
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  summaryValue: {
    color: '#101828',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  summaryMeta: {
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  form: {
    gap: 14,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  list: {
    gap: 10,
  },
  row: {
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: '#101828',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  rowMeta: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  amount: {
    color: '#c2410c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
});
