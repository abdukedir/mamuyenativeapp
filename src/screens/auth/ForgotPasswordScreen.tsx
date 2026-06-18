import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { LanguageSelector } from '@/components/auth/LanguageSelector';
import { useTranslation } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/validations/authSchemas';
import { AuthScreenFrame } from './AuthScreenFrame';

export function ForgotPasswordScreen() {
  const t = useTranslation();
  const { resetPassword } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPassword(values);
      Alert.alert(t('checkYourEmail'), t('passwordResetInstructionsSent'));
    } catch (error) {
      Alert.alert(t('resetFailed'), getFirebaseErrorMessage(error));
    }
  });

  return (
    <AuthScreenFrame title={t('resetPassword')} subtitle={t('resetPasswordSubtitle')}>
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
        <AuthButton title={t('sendResetEmail')} loading={isSubmitting} onPress={onSubmit} />
      </View>
      <Link href={'/login' as never} style={styles.link}>
        {t('backToSignIn')}
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
