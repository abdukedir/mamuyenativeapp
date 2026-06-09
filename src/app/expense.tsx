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
import { createExpense } from '@/services/activityService';
import { formatProductPrice } from '@/types/product';
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
  const { expenses, totals } = useActivities();
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
      Alert.alert('Sign in required', 'Please sign in before registering expenses.');
      return;
    }

    Alert.alert(
      'Approve expense?',
      `${values.title}\nAmount: ${formatProductPrice(values.amount)}\n\nThis will decrease total value.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await createExpense(values, userProfile);
              reset();
              Alert.alert('Expense registered', 'Total value has been updated.');
            } catch (error) {
              Alert.alert('Expense failed', getFirebaseErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  return (
    <MobileShell>
      <AppHeader title="Expense" left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <ThemedText style={styles.summaryLabel}>Approved expenses</ThemedText>
          <ThemedText style={styles.summaryValue}>{formatProductPrice(totals.totalExpenses)}</ThemedText>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput
                error={errors.title?.message}
                label="Expense title"
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
                label="Amount"
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
                label="Note"
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Optional details"
                style={styles.textArea}
                value={value}
              />
            )}
          />
          <AuthButton title="Register Expense" loading={isSubmitting} onPress={handleSubmit(submitExpense)} />
        </View>

        <View style={styles.list}>
          {expenses.slice(0, 8).map((expense) => (
            <View key={expense.id} style={styles.row}>
              <View style={styles.rowText}>
                <ThemedText style={styles.rowTitle}>{expense.title}</ThemedText>
                <ThemedText style={styles.rowMeta}>{expense.createdByName}</ThemedText>
              </View>
              <ThemedText style={styles.amount}>{formatProductPrice(expense.amount)}</ThemedText>
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
