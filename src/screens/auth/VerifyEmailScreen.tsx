import { MailCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { LanguageSelector } from '@/components/auth/LanguageSelector';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { AuthScreenFrame } from './AuthScreenFrame';

export function VerifyEmailScreen() {
  const t = useTranslation();
  const {
    loading,
    logout,
    refreshUserProfile,
    resendEmailVerification,
    user,
  } = useAuth();

  const isCheckingRef = useRef(false);

  const checkVerification = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      await refreshUserProfile();
    } catch (error) {
      console.warn('Verification check failed', getFirebaseErrorMessage(error));
    } finally {
      isCheckingRef.current = false;
    }
  }, [refreshUserProfile]);

  useEffect(() => {
    void checkVerification();

    const interval = setInterval(() => {
      void checkVerification();
    }, 5000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void checkVerification();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkVerification]);

  async function handleResend() {
    try {
      await resendEmailVerification();
      Alert.alert(t('emailSent'), t('newVerificationLinkSent'));
    } catch (error) {
      Alert.alert(t('couldNotSendEmail'), getFirebaseErrorMessage(error));
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login' as never);
  }

  return (
    <AuthScreenFrame title={t('verifyYourEmail')} subtitle={t('openVerificationLink')}>
      <LanguageSelector />
      <View style={styles.panel}>
        <View style={styles.icon}>
          <MailCheck color="#0878ff" size={34} strokeWidth={2.2} />
        </View>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
        <ThemedText style={styles.copy}>
          {t('verifiedEmailProtection')}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <AuthButton title={t('iVerifiedMyEmail')} loading={loading} onPress={checkVerification} />
        <AuthButton title={t('resendEmail')} variant="secondary" onPress={handleResend} />
        <AuthButton title={t('signOut')} variant="secondary" onPress={handleLogout} />
      </View>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe7ff',
    backgroundColor: '#ffffff',
    padding: 22,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf2ff',
  },
  email: {
    color: '#101828',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  copy: {
    color: '#667085',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
});
