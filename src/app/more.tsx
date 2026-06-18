import { router } from 'expo-router';
import {
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  User,
  UserCog,
  Users,
} from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useAppSettings';
import { isSalesperson, roleLabels } from '@/types/user';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

const menuItems = [
  { labelKey: 'dashboard', href: '/', Icon: LayoutDashboard },
  { labelKey: 'products', href: '/explore', Icon: Package },
  { labelKey: 'sales', href: '/sales', Icon: ShoppingCart },
  { labelKey: 'purchases', href: '/purchases', Icon: Boxes },
  { labelKey: 'expenses', href: '/expense', Icon: ReceiptText },
  { labelKey: 'customers', href: '/customers', Icon: Users },
  { labelKey: 'suppliers', href: '/suppliers', Icon: Truck },
  { labelKey: 'credits', href: '/credits', Icon: CreditCard },
  { labelKey: 'reports', href: '/reports', Icon: BarChart3 },
  { labelKey: 'notifications', href: '/notifications', Icon: Bell },
  { labelKey: 'userManagement', href: '/user-management', Icon: UserCog },
  { labelKey: 'profile', href: '/profile', Icon: User },
  { labelKey: 'settings', href: '/settings', Icon: Settings },
] as const;

export default function MenuScreen() {
  const t = useTranslation();
  const { loading, logout, userProfile } = useAuth();
  const salesperson = isSalesperson(userProfile);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Sign out failed', getFirebaseErrorMessage(error));
    } finally {
      router.replace('/login' as never);
    }
  }

  return (
    <MobileShell>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{userProfile?.fullName?.charAt(0) ?? 'M'}</ThemedText>
          </View>
          <View style={styles.profileText}>
            <ThemedText style={styles.name}>{userProfile?.fullName ?? 'Signed in user'}</ThemedText>
            <ThemedText style={styles.meta}>
              {userProfile ? roleLabels[userProfile.role] : 'Member'} · {userProfile?.email}
            </ThemedText>
          </View>
        </View>

        <View style={styles.menu}>
          {!salesperson && menuItems.map(({ Icon, ...item }) => (
            <Pressable
              key={item.href}
              accessibilityRole="button"
              onPress={() => router.push(item.href as never)}
              style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Icon color="#0878ff" size={22} strokeWidth={2.3} />
              </View>
              <ThemedText style={styles.menuText}>{t(item.labelKey)}</ThemedText>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={handleLogout}
            style={styles.menuItem}>
            <View style={styles.logoutIcon}>
              <LogOut color="#d92d20" size={22} strokeWidth={2.3} />
            </View>
            <ThemedText style={styles.logoutText}>{t('logout')}</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav active="more" />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 18,
    paddingBottom: 22,
    gap: 18,
  },
  profile: {
    minHeight: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0878ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  profileText: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#101828',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  meta: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  menu: {
    gap: 10,
  },
  menuItem: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#feecee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: '#101828',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  logoutText: {
    color: '#d92d20',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
});
