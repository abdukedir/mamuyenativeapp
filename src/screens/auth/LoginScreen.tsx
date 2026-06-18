import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { LanguageSelector } from '@/components/auth/LanguageSelector';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useTranslation } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { loginSchema, type LoginFormValues } from '@/validations/authSchemas';
import { AuthScreenFrame } from './AuthScreenFrame';

export function LoginScreen() {
  const t = useTranslation();
  const { login, loading } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      Alert.alert(t('signInFailed'), getFirebaseErrorMessage(error));
    }
  });

  return (
    <AuthScreenFrame title={t('welcomeBack')} subtitle={t('loginSubtitle')}>
      <View style={styles.form}>
        <LanguageSelector />
        <Controller
          control={control}
          name="username"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthInput
              autoComplete="username"
              error={errors.username?.message}
              label={t('username')}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t('enterUsername')}
              textContentType="username"
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
              label={t('password')}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t('password')}
              value={value}
            />
          )}
        />
        <Link href={'/forgot-password' as never} style={styles.forgot}>
          {t('forgotPassword')}
        </Link>
        <AuthButton title={t('signIn')} loading={loading || isSubmitting} onPress={onSubmit} />
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
  link: {
    color: '#0878ff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
});
