import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { loginSchema, type LoginFormValues } from '@/validations/authSchemas';
import { AuthScreenFrame } from './AuthScreenFrame';

export function LoginScreen() {
  const { login, loading } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      Alert.alert('Sign in failed', getFirebaseErrorMessage(error));
    }
  });

  return (
    <AuthScreenFrame title="Welcome back" subtitle="Sign in to manage products, orders, and deliveries.">
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
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <PasswordInput
              error={errors.password?.message}
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter your password"
              value={value}
            />
          )}
        />
        <Link href={'/forgot-password' as never} style={styles.forgot}>
          Forgot password?
        </Link>
        <AuthButton title="Sign in" loading={loading || isSubmitting} onPress={onSubmit} />
      </View>
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>New to Mamuye?</ThemedText>
        <Link href={'/register' as never} style={styles.link}>
          Create account
        </Link>
      </View>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  forgot: {
    alignSelf: 'flex-end',
    color: '#0878ff',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  link: {
    color: '#0878ff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
});
