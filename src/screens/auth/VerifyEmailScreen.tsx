import { MailCheck } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppState } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { AuthScreenFrame } from './AuthScreenFrame';

export function VerifyEmailScreen() {
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
      Alert.alert('Email sent', 'A new verification link has been sent.');
    } catch (error) {
      Alert.alert('Could not send email', getFirebaseErrorMessage(error));
    }
  }

  return (
    <AuthScreenFrame title="Verify your email" subtitle="Open the verification link before accessing your workspace.">
      <View style={styles.panel}>
        <View style={styles.icon}>
          <MailCheck color="#0878ff" size={34} strokeWidth={2.2} />
        </View>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
        <ThemedText style={styles.copy}>
          We use verified email addresses to protect orders, inventory, and account recovery.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <AuthButton title="I verified my email" loading={loading} onPress={checkVerification} />
        <AuthButton title="Resend email" variant="secondary" onPress={handleResend} />
        <AuthButton title="Sign out" variant="secondary" onPress={logout} />
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
