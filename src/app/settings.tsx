import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useMoneyFormatter, useTranslation } from '@/hooks/useAppSettings';
import { useProducts } from '@/hooks/useProducts';
import {
  defaultSettings,
  requestFirestoreBackup,
  requestFirestoreRestore,
  subscribeToSettings,
  updateSettings,
} from '@/services/businessService';
import {
  getAvailableNotificationSounds,
  setNotificationSoundEnabled,
  setNotificationSoundName,
  setNotificationsEnabled,
  updateUserNotificationSettings,
} from '@/services/notificationService';
import type { AppSettings } from '@/types/business';
import { supportedCurrencies } from '@/types/product';
import { canAccessAllApp } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export default function SettingsScreen() {
  const t = useTranslation();
  const formatMoney = useMoneyFormatter();
  const { resetPassword, userProfile } = useAuth();
  const { loading: productsLoading, stats } = useProducts();
  const [settings, setSettings] = useState<Omit<AppSettings, 'updatedAt'>>(defaultSettings);
  const notificationSoundOptions = getAvailableNotificationSounds();
  const canManageGlobalSettings = canAccessAllApp(userProfile);

  useEffect(() => {
    return subscribeToSettings(
      (next) => {
        setSettings(next);
        setNotificationsEnabled(next.notificationsEnabled);
        setNotificationSoundEnabled(next.notificationSound);
        setNotificationSoundName(next.notificationSoundName);
      },
      () => undefined
    );
  }, []);

  async function save(updates: Partial<AppSettings>) {
    if (!userProfile) return;

    try {
      const next = { ...settings, ...updates };
      setSettings(next);
      if (canManageGlobalSettings) {
        await updateSettings(updates, userProfile);
      }
      await updateUserNotificationSettings(userProfile.uid, next);
      Alert.alert('Settings saved', 'Your settings were updated in Firebase.');
    } catch (error) {
      Alert.alert('Settings failed', getFirebaseErrorMessage(error));
    }
  }

  async function handleBackup() {
    if (!canAccessAllApp(userProfile)) {
      Alert.alert(t('signInRequired'), 'Please sign in with an active account before requesting Firestore backups.');
      return;
    }

    try {
      const result = await requestFirestoreBackup();
      Alert.alert('Backup requested', `Firebase backup request ${result.data.id} was created.`);
    } catch (error) {
      Alert.alert('Backup failed', getFirebaseErrorMessage(error));
    }
  }

  async function handleRestore() {
    if (!canAccessAllApp(userProfile)) {
      Alert.alert(t('signInRequired'), 'Please sign in with an active account before requesting Firestore restores.');
      return;
    }

    try {
      const result = await requestFirestoreRestore();
      Alert.alert('Restore requested', `Firebase restore request ${result.data.id} was created.`);
    } catch (error) {
      Alert.alert('Restore failed', getFirebaseErrorMessage(error));
    }
  }

  async function handleChangePassword() {
    if (!userProfile?.username) {
      Alert.alert(t('username'), 'Your Firebase profile does not have a username.');
      return;
    }

    try {
      await resetPassword({ username: userProfile.username });
      Alert.alert('Password email sent', 'Firebase sent a password reset email to your account.');
    } catch (error) {
      Alert.alert('Password reset failed', getFirebaseErrorMessage(error));
    }
  }

  return (
    <MobileShell>
      <AppHeader title={t('settings')} left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.valuePanel}>
          <ThemedText style={styles.valueLabel}>{t('businessValue')}</ThemedText>
          <ThemedText style={styles.valueAmount}>
            {productsLoading ? '...' : formatMoney(stats.totalValue)}
          </ThemedText>
          <ThemedText style={styles.valueMeta}>
            {t('totalItems')}: {productsLoading ? '...' : stats.totalItems}
          </ThemedText>
        </View>

        <Section title={t('generalSettings')}>
          <OptionRow label={t('currency')} value={settings.currency} values={[...supportedCurrencies]} onChange={(currency) => save({ currency })} />
          <OptionRow label={t('theme')} value={settings.theme} values={['system', 'light', 'dark']} onChange={(theme) => save({ theme: theme as AppSettings['theme'] })} />
        </Section>

        <Section title={t('stockAlertSettings')}>
          <SwitchRow label={t('enableNotifications')} value={settings.notificationsEnabled} onValueChange={(notificationsEnabled) => save({ notificationsEnabled })} />
          <SwitchRow label={t('notificationSound')} value={settings.notificationSound} onValueChange={(notificationSound) => save({ notificationSound })} />
          <NotificationSoundRow
            label={t('defaultNotificationSound')}
            value={settings.notificationSoundName}
            values={notificationSoundOptions}
            onChange={(notificationSoundName) => save({ notificationSoundName })}
          />
          <SwitchRow label={t('clearNotificationsAfterViewing')} value={settings.clearNotificationsAfterViewing} onValueChange={(clearNotificationsAfterViewing) => save({ clearNotificationsAfterViewing })} />
          <SwitchRow label={t('dailyReminder')} value={settings.dailyReminder} onValueChange={(dailyReminder) => save({ dailyReminder })} />
          <AuthInput label={t('minimumStockLevel')} keyboardType="number-pad" value={String(settings.minimumStockLevel)} onChangeText={(value) => setSettings((current) => ({ ...current, minimumStockLevel: Number(value) || 0 }))} onBlur={() => save({ minimumStockLevel: settings.minimumStockLevel })} />
          <AuthInput label={t('criticalStockLevel')} keyboardType="number-pad" value={String(settings.criticalStockLevel)} onChangeText={(value) => setSettings((current) => ({ ...current, criticalStockLevel: Number(value) || 0 }))} onBlur={() => save({ criticalStockLevel: settings.criticalStockLevel })} />
        </Section>

        <Section title={t('backupSettings')}>
          <AuthButton title={t('requestFirestoreBackup')} variant="secondary" onPress={handleBackup} />
          <AuthButton title={t('restoreData')} variant="secondary" onPress={handleRestore} />
        </Section>

        <Section title={t('securitySettings')}>
          <SwitchRow label={t('pinLock')} value={settings.pinLock} onValueChange={(pinLock) => save({ pinLock })} />
          <SwitchRow label={t('biometricAuthentication')} value={settings.biometricAuth} onValueChange={(biometricAuth) => save({ biometricAuth })} />
          <AuthButton title={t('changePassword')} variant="secondary" onPress={handleChangePassword} />
        </Section>

        <Section title={t('applicationSettings')}>
          <ThemedText style={styles.meta}>Mamuye Electronics Stock Management</ThemedText>
          <ThemedText style={styles.meta}>Version 1.0.0</ThemedText>
          <ThemedText style={styles.meta}>Support: support@mamuye.local</ThemedText>
        </Section>
      </ScrollView>
    </MobileShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {children}
    </View>
  );
}

function SwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function OptionRow({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <View style={styles.optionBlock}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.options}>
        {values.map((item) => (
          <Pressable key={item} onPress={() => onChange(item)} style={[styles.option, value === item && styles.optionActive]}>
            <ThemedText style={[styles.optionText, value === item && styles.optionTextActive]}>{item}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function NotificationSoundRow({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  const selectedLabel = formatSoundLabel(value);

  return (
    <View style={styles.soundBlock}>
      <View style={styles.soundHeader}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.soundValue}>{selectedLabel}</ThemedText>
      </View>
      <View style={styles.options}>
        {values.map((item) => {
          const optionLabel = formatSoundLabel(item);

          return (
            <Pressable key={item} onPress={() => onChange(item)} style={[styles.option, value === item && styles.optionActive]}>
              <ThemedText style={[styles.optionText, value === item && styles.optionTextActive]}>{optionLabel}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatSoundLabel(soundName: string) {
  return soundName === 'default' ? 'Default' : soundName;
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 14 },
  valuePanel: {
    borderRadius: 12,
    backgroundColor: '#0878ff',
    padding: 16,
    gap: 4,
  },
  valueLabel: {
    color: '#eaf2ff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  valueAmount: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
  },
  valueMeta: {
    color: '#eaf2ff',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  section: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 12 },
  title: { color: '#101828', fontSize: 16, fontWeight: '900' },
  label: { color: '#344054', fontSize: 14, fontWeight: '800' },
  meta: { color: '#667085', fontSize: 13, fontWeight: '600' },
  switchRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soundBlock: { gap: 8, borderRadius: 10, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fbfcff', padding: 12 },
  soundHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  soundValue: { color: '#0878ff', fontSize: 13, fontWeight: '900' },
  optionBlock: { gap: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 8, borderWidth: 1, borderColor: '#d0d5dd', paddingHorizontal: 12, paddingVertical: 8 },
  optionActive: { borderColor: '#0878ff', backgroundColor: '#eaf2ff' },
  optionText: { color: '#475467', fontSize: 13, fontWeight: '800' },
  optionTextActive: { color: '#0878ff' },
});
