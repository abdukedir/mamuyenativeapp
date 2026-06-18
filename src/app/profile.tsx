import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/services/userService';
import { roleLabels } from '@/types/user';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

type ProfileForm = { fullName: string; phone: string; profileImage: string };

export default function ProfileScreen() {
  const t = useTranslation();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    values: {
      fullName: userProfile?.fullName ?? '',
      phone: userProfile?.phone ?? '',
      profileImage: userProfile?.profileImage ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!userProfile) return;

    confirmAction({
      title: t('saveProfileQuestion'),
      message: t('saveProfileMessage'),
      confirmText: t('save'),
      onConfirm: async () => {
        try {
          await updateUserProfile(userProfile.uid, {
            fullName: values.fullName,
            phone: values.phone || null,
            profileImage: values.profileImage || null,
          });
          await refreshUserProfile();
          Alert.alert(t('profileUpdated'), t('profileUpdatedMessage'));
        } catch (error) {
          Alert.alert(t('profileFailed'), getFirebaseErrorMessage(error));
        }
      },
    });
  });

  return (
    <MobileShell>
      <AppHeader title={t('profile')} left="back" right="none" onLeftPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ThemedText style={styles.title}>{t('accountInformation')}</ThemedText>
          <ThemedText style={styles.meta}>{t('email')}: {user?.email}</ThemedText>
          <ThemedText style={styles.meta}>{t('role')}: {userProfile ? roleLabels[userProfile.role] : t('member')}</ThemedText>
          <ThemedText style={styles.meta}>{t('status')}: {userProfile?.isActive ? t('active') : t('inactive')}</ThemedText>
        </View>
        <View style={styles.form}>
          <Controller control={control} name="fullName" render={({ field: { onBlur, onChange, value } }) => (
            <AuthInput label={t('fullName')} onBlur={onBlur} onChangeText={onChange} value={value} />
          )} />
          <Controller control={control} name="phone" render={({ field: { onBlur, onChange, value } }) => (
            <AuthInput label={t('phoneNumber')} onBlur={onBlur} onChangeText={onChange} value={value} />
          )} />
          <Controller control={control} name="profileImage" render={({ field: { onBlur, onChange, value } }) => (
            <AuthInput label={t('profileImageUrl')} autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
          )} />
          <AuthButton title={t('saveProfile')} loading={isSubmitting} onPress={onSubmit} />
          <AuthButton title={t('changePassword')} variant="secondary" onPress={() => Alert.alert(t('changePassword'), t('changePasswordHelp'))} />
        </View>
        <View style={styles.card}>
          <ThemedText style={styles.title}>{t('loginHistory')}</ThemedText>
          <ThemedText style={styles.meta}>{t('recentLoginHistory')}</ThemedText>
        </View>
      </ScrollView>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 14 },
  form: { gap: 12 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 6 },
  title: { color: '#101828', fontSize: 16, fontWeight: '900' },
  meta: { color: '#667085', fontSize: 13, fontWeight: '700' },
});
