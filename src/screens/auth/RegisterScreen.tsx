import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { roleLabels, type UserRole } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  registerSchema,
  type RegisterFormValues,
  userRoles,
} from '@/validations/authSchemas';
import { AuthScreenFrame } from './AuthScreenFrame';

export function RegisterScreen() {
  const { register, loading } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'sales',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register(values);
      Alert.alert('Verify your email', 'We sent a verification link to your inbox.');
    } catch (error) {
      Alert.alert('Registration failed', getFirebaseErrorMessage(error));
    }
  });

  return (
    <AuthScreenFrame title="Create account" subtitle="Choose your role and secure your account.">
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthInput
              autoCapitalize="words"
              autoComplete="name"
              error={errors.fullName?.message}
              label="Full name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Full name"
              textContentType="name"
              value={value}
            />
          )}
        />
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
          name="role"
          render={({ field: { onChange, value } }) => (
            <View style={styles.roleWrap}>
              <ThemedText style={styles.label}>Role</ThemedText>
              <View style={styles.roles}>
                {userRoles.map((role) => (
                  <RoleOption
                    key={role}
                    active={value === role}
                    label={roleLabels[role]}
                    onPress={() => onChange(role)}
                    role={role}
                  />
                ))}
              </View>
              {errors.role?.message ? (
                <ThemedText style={styles.error}>{errors.role.message}</ThemedText>
              ) : null}
            </View>
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
              placeholder="At least 8 characters"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <PasswordInput
              error={errors.confirmPassword?.message}
              label="Confirm password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Repeat password"
              value={value}
            />
          )}
        />
        <AuthButton title="Create account" loading={loading || isSubmitting} onPress={onSubmit} />
      </View>
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Already registered?</ThemedText>
        <Link href={'/login' as never} style={styles.link}>
          Sign in
        </Link>
      </View>
    </AuthScreenFrame>
  );
}

function RoleOption({
  active,
  label,
  onPress,
  role,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  role: UserRole;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label} role`}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.role, active && styles.roleActive]}>
      <ThemedText style={[styles.roleText, active && styles.roleTextActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 15,
  },
  roleWrap: {
    gap: 8,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  roles: {
    flexDirection: 'row',
    gap: 8,
  },
  role: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  roleActive: {
    borderColor: '#0878ff',
    backgroundColor: '#eaf2ff',
  },
  roleText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  roleTextActive: {
    color: '#0878ff',
  },
  error: {
    color: '#d92d20',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
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
