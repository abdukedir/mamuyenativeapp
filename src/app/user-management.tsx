import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessCollection } from '@/hooks/useBusinessCollection';
import { useTranslation } from '@/hooks/useAppSettings';
import { subscribeToActivityLogs } from '@/services/businessService';
import {
  createManagedUserOnSpark,
  deleteManagedUser,
  deleteManagedUserProfile,
  setManagedUserStatusWithFallback,
  subscribeToUsers,
  updateManagedUserRoleWithFallback,
} from '@/services/userService';
import type { ActivityLog } from '@/types/business';
import type { UserProfile, UserRole } from '@/types/user';
import { hasMemberAccess, roleLabels } from '@/types/user';
import { confirmAction } from '@/utils/confirmAction';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { useEffect, useState } from 'react';

type UserForm = {
  fullName: string;
  username: string;
  phone: string;
  password: string;
  role: UserRole;
};

const roles: UserRole[] = ['admin', 'member', 'manager', 'salesperson'];

export default function UserManagementScreen() {
  const t = useTranslation();
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const { items: logs } = useBusinessCollection<ActivityLog>(subscribeToActivityLogs);
  const canManageUsers = hasMemberAccess(userProfile);
  const { control, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<UserForm>({
    defaultValues: { fullName: '', username: '', phone: '', password: '', role: 'salesperson' },
  });
  const selectedRole = useWatch({ control, name: 'role' });

  useEffect(() => {
    if (!canManageUsers) return undefined;

    return subscribeToUsers(
      (items) => {
        setUsers(items);
        setLoadingUsers(false);
      },
      (error) => {
        setUserError(getFirebaseErrorMessage(error));
        setLoadingUsers(false);
      }
    );
  }, [canManageUsers]);

  const onCreateUser = handleSubmit(async (values) => {
    if (!canManageUsers) return;

    const username = values.username.trim().toLowerCase();
    const fullName = values.fullName.trim().replace(/\s+/g, ' ');
    const password = values.password.trim();
    const phone = values.phone.trim() || null;

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      const message = 'Username must be 3-30 characters and use only lowercase letters, numbers, or underscore.';
      setUserError(message);
      Alert.alert(t('userCreationFailed'), message);
      return;
    }

    if (!fullName) {
      const message = 'Full name is required.';
      setUserError(message);
      Alert.alert(t('userCreationFailed'), message);
      return;
    }

    if (password.length < 6) {
      const message = 'Temporary password must be at least 6 characters.';
      setUserError(message);
      Alert.alert(t('userCreationFailed'), message);
      return;
    }

    confirmAction({
      title: t('createUser'),
      message: `Create @${username} as ${roleLabels[values.role]}?`,
      confirmText: t('createUser'),
      onConfirm: async () => {
        try {
          setUserError(null);
          await createManagedUserOnSpark({
            username,
            password,
            fullName,
            phone,
            role: values.role,
          });
          reset({ fullName: '', username: '', phone: '', password: '', role: 'salesperson' });
          Alert.alert(t('userCreated'), t('userCreatedMessage'));
        } catch (error) {
          const message = getFirebaseErrorMessage(error);
          setUserError(message);
          Alert.alert(t('userCreationFailed'), message);
        }
      },
    });
  });

  const updateRole = async (target: UserProfile, role: UserRole) => {
    if (target.role === role) return;

    try {
      setUserError(null);
      setBusyUserId(target.uid);
      setBusyAction(`role-${role}`);
      await updateManagedUserRoleWithFallback(target.uid, role);
      Alert.alert(t('roleUpdated'), t('roleUpdatedMessage'));
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setUserError(message);
      Alert.alert(t('roleUpdateFailed'), message);
    } finally {
      setBusyUserId(null);
      setBusyAction(null);
    }
  };

  const toggleActive = async (target: UserProfile) => {
    const nextStatus = !target.isActive;
    try {
      setUserError(null);
      setBusyUserId(target.uid);
      setBusyAction('status');
      const mode = await setManagedUserStatusWithFallback(target.uid, nextStatus);
      Alert.alert(
        t('statusUpdated'),
        mode === 'functions'
          ? `Firebase Auth account was ${nextStatus ? 'enabled' : 'disabled'}.`
          : `Firestore profile was ${nextStatus ? 'activated' : 'deactivated'}. Deploy functions to also ${
              nextStatus ? 'enable' : 'disable'
            } the Auth account.`
      );
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setUserError(message);
      Alert.alert(t('statusUpdateFailed'), message);
    } finally {
      setBusyUserId(null);
      setBusyAction(null);
    }
  };

  const removeUser = async (target: UserProfile) => {
    if (target.uid === userProfile?.uid) {
      Alert.alert(t('deleteBlocked'), t('cannotDeleteOwnAdmin'));
      return;
    }

    try {
      setUserError(null);
      setBusyUserId(target.uid);
      setBusyAction('delete');
      await deleteManagedUser(target.uid);
      Alert.alert(t('userDeleted'), t('userDeletedMessage'));
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      try {
        await deleteManagedUserProfile(target.uid);
        Alert.alert(t('profileDeleted'), t('profileDeletedMessage'));
      } catch (fallbackError) {
        const fallbackMessage = getFirebaseErrorMessage(fallbackError);
        setUserError(`${message} ${fallbackMessage}`);
        Alert.alert(t('deleteFailed'), fallbackMessage);
      }
    } finally {
      setBusyUserId(null);
      setBusyAction(null);
    }
  };

  if (!canManageUsers) {
    return (
      <MobileShell>
        <AppHeader title={t('users')} left="back" right="none" onLeftPress={() => router.back()} />
        <View style={styles.card}>
          <ThemedText style={styles.title}>{t('adminOnly')}</ThemedText>
          <ThemedText style={styles.meta}>{t('adminOnlyUsersMessage')}</ThemedText>
        </View>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <AppHeader title={t('users')} left="back" right="none" onLeftPress={() => router.back()} />
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.form}>
            <ThemedText style={styles.heading}>{t('createUser')}</ThemedText>
            <Controller control={control} name="fullName" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('fullName')} onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="username" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('username')} autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="phone" render={({ field: { onBlur, onChange, value } }) => (
              <AuthInput label={t('phone')} keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Controller control={control} name="password" render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput label={t('temporaryPassword')} onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <View style={styles.roleRow}>
              {roles.map((role) => (
                <Pressable
                  key={role}
                  onPress={() => setValue('role', role)}
                  style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}>
                  <ThemedText style={[styles.roleText, selectedRole === role && styles.roleTextActive]}>{roleLabels[role]}</ThemedText>
                </Pressable>
              ))}
            </View>
            <AuthButton title={t('createUser')} loading={isSubmitting} onPress={onCreateUser} />
            {userError ? <ThemedText style={styles.error}>{userError}</ThemedText> : null}
            <ThemedText style={styles.heading}>{t('userTable')}</ThemedText>
          </View>
        }
        ListEmptyComponent={!loadingUsers ? <ThemedText style={styles.empty}>{t('noUsersFound')}</ThemedText> : null}
        renderItem={({ item }) => {
          const rowBusy = busyUserId === item.uid;

          return (
          <View style={styles.card}>
            <ThemedText style={styles.title}>{item.fullName}</ThemedText>
            <ThemedText style={styles.meta}>@{item.username ?? item.usernameLower}</ThemedText>
            <ThemedText style={styles.meta}>{item.email}</ThemedText>
            <ThemedText style={styles.meta}>{item.phone ?? t('noPhone')}</ThemedText>
            <ThemedText style={styles.meta}>{roleLabels[item.role]} · {item.isActive ? 'Active' : 'Inactive'}</ThemedText>
            <View style={styles.roleRow}>
              {roles.map((role) => (
                <Pressable
                  key={role}
                  disabled={rowBusy}
                  onPress={() => updateRole(item, role)}
                  style={[
                    styles.smallAction,
                    item.role === role && styles.currentRole,
                    rowBusy && styles.disabledAction,
                  ]}>
                  <ThemedText style={styles.smallActionText}>
                    {rowBusy && busyAction === `role-${role}` ? t('saving') : roleLabels[role]}
                  </ThemedText>
                </Pressable>
              ))}
              <Pressable
                disabled={rowBusy}
                onPress={() => toggleActive(item)}
                style={[styles.smallAction, item.isActive ? styles.danger : styles.success, rowBusy && styles.disabledAction]}>
                <ThemedText style={[styles.smallActionText, styles.statusText]}>
                  {rowBusy && busyAction === 'status' ? t('saving') : item.isActive ? t('deactivate') : t('activate')}
                </ThemedText>
              </Pressable>
              <Pressable
                disabled={rowBusy}
                onPress={() => removeUser(item)}
                style={[styles.smallAction, styles.danger, rowBusy && styles.disabledAction]}>
                <ThemedText style={[styles.smallActionText, styles.statusText]}>
                  {rowBusy && busyAction === 'delete' ? t('deleting') : t('delete')}
                </ThemedText>
              </Pressable>
            </View>
          </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <ThemedText style={styles.heading}>{t('activityLogs')}</ThemedText>
            {logs.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.logRow}>
                <ThemedText style={styles.logText}>{item.userName}</ThemedText>
                <ThemedText style={styles.meta}>{item.role} · {item.action}</ThemedText>
              </View>
            ))}
          </View>
        }
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 12 },
  form: { gap: 12 },
  footer: { gap: 8, marginTop: 8 },
  heading: { color: '#101828', fontSize: 16, fontWeight: '900' },
  empty: { color: '#667085', textAlign: 'center', padding: 18 },
  error: { color: '#d92d20', fontSize: 13, fontWeight: '800' },
  card: { marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 8 },
  title: { color: '#101828', fontSize: 16, fontWeight: '900' },
  meta: { color: '#667085', fontSize: 13, fontWeight: '700' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { borderRadius: 8, borderWidth: 1, borderColor: '#d0d5dd', paddingHorizontal: 10, paddingVertical: 8 },
  roleChipActive: { borderColor: '#0878ff', backgroundColor: '#eaf2ff' },
  roleText: { color: '#344054', fontSize: 12, fontWeight: '900' },
  roleTextActive: { color: '#0878ff' },
  smallAction: { borderRadius: 8, backgroundColor: '#eaf2ff', paddingHorizontal: 10, paddingVertical: 8 },
  currentRole: { borderWidth: 1, borderColor: '#0878ff' },
  disabledAction: { opacity: 0.55 },
  danger: { backgroundColor: '#feecee' },
  success: { backgroundColor: '#eafaf0' },
  smallActionText: { color: '#0878ff', fontSize: 12, fontWeight: '900' },
  statusText: { color: '#101828' },
  logRow: { borderRadius: 10, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 12, gap: 4 },
  logText: { color: '#101828', fontSize: 13, fontWeight: '900' },
});
