import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/validations/authSchemas';
import { AuthScreenFrame } from './AuthScreenFrame';

export function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPassword(values);
      Alert.alert('Check your email', 'Password reset instructions have been sent.');
    } catch (error) {
      Alert.alert('Reset failed', getFirebaseErrorMessage(error));
    }
  });

  return (
    <AuthScreenFrame title="Reset password" subtitle="Enter your email and we will send reset instructions.">
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthInput
              autoComplete="email"
              error={errors.email?.message}
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="you@example.com"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />
        <AuthButton title="Send reset email" loading={isSubmitting} onPress={onSubmit} />
      </View>
      <Link href={'/login' as never} style={styles.link}>
        Back to sign in
      </Link>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  link: {
    alignSelf: 'center',
    color: '#0878ff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
});
