import { Alert, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { ActionScreen } from '@/components/inventory/action-screen';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { roleDescriptions, roleLabels } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export default function MoreScreen() {
  const { loading, logout, userProfile } = useAuth();
  const role = userProfile?.role;

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Sign out failed', getFirebaseErrorMessage(error));
    }
  }

  return (
    <ActionScreen
      title="More"
      description="Profile, settings, suppliers, inventory, and app administration shortcuts will be grouped here."
      activeTab="more">
      <View style={styles.profile}>
        <ThemedText style={styles.name}>{userProfile?.fullName ?? 'Signed in user'}</ThemedText>
        <ThemedText style={styles.email}>{userProfile?.email}</ThemedText>
        <ThemedText style={styles.role}>{role ? roleLabels[role] : 'Member'}</ThemedText>
        <ThemedText style={styles.description}>
          {role ? roleDescriptions[role] : 'Basic app profile.'}
        </ThemedText>
      </View>
      <AuthButton title="Sign out" loading={loading} variant="secondary" onPress={handleLogout} />
    </ActionScreen>
  );
}

const styles = StyleSheet.create({
  profile: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  name: {
    color: '#101828',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  email: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  role: {
    color: '#0878ff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  description: {
    color: '#475467',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
