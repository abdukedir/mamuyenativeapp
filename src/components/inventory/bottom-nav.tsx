import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { BarChart3, Home, MoreHorizontal, Package, Plus, ReceiptText, ShoppingCart } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useAppSettings';
import { useTheme } from '@/hooks/use-theme';
import { canAccessAllApp, isSalesperson } from '@/types/user';

type ActiveTab = 'home' | 'products' | 'sales' | 'expenses' | 'reports' | 'more';

const tabs = [
  { id: 'home', labelKey: 'home', Icon: Home, href: '/' },
  { id: 'products', labelKey: 'products', Icon: Package, href: '/explore' },
  { id: 'expenses', labelKey: 'expense', Icon: ReceiptText, href: '/expense' },
  { id: 'more', labelKey: 'more', Icon: MoreHorizontal, href: '/more' },
] as const;

const salespersonTabs = [
  { id: 'sales', labelKey: 'sales', Icon: ShoppingCart, href: '/sales' },
  { id: 'expenses', labelKey: 'expense', Icon: ReceiptText, href: '/expense' },
  { id: 'reports', labelKey: 'reports', Icon: BarChart3, href: '/reports' },
  { id: 'more', labelKey: 'more', Icon: MoreHorizontal, href: '/more' },
] as const;

export function BottomNav({ active }: { active: ActiveTab }) {
  const theme = useTheme();
  const t = useTranslation();
  const { userProfile } = useAuth();
  const canAddProduct = canAccessAllApp(userProfile);
  const salesperson = isSalesperson(userProfile);

  function handleAddProduct() {
    if (!canAddProduct) {
      Alert.alert(t('permissionRequired'), t('onlyManagersAdminsAddProducts'));
      return;
    }

    router.push('/add-product');
  }

  return (
    <View style={styles.wrap}>
      {salesperson ? (
        salespersonTabs.map((tab) => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} color={theme.text} label={t(tab.labelKey)} />
        ))
      ) : (
        <>
          {tabs.slice(0, 2).map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} color={theme.text} label={t(tab.labelKey)} />
          ))}
          <Pressable
            accessibilityLabel="Add product"
            accessibilityRole="button"
            onPress={handleAddProduct}
            style={[styles.addButton, !canAddProduct && styles.addButtonDisabled]}>
            <Plus color="#fff" size={34} strokeWidth={2.2} />
          </Pressable>
          {tabs.slice(2).map((tab) => (
            <NavItem key={tab.id} tab={tab} active={active === tab.id} color={theme.text} label={t(tab.labelKey)} />
          ))}
        </>
      )}
    </View>
  );
}

function NavItem({
  tab,
  active,
  color,
  label,
}: {
  tab: (typeof tabs)[number] | (typeof salespersonTabs)[number];
  active: boolean;
  color: string;
  label: string;
}) {
  const Icon = tab.Icon;

  return (
    <Pressable onPress={() => router.push(tab.href as never)} style={styles.item}>
      <Icon color={active ? '#0878ff' : color} size={22} strokeWidth={active ? 2.6 : 2.1} />
      <ThemedText style={[styles.label, active && styles.activeLabel]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  item: {
    width: 58,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    color: '#667085',
    fontWeight: '700',
  },
  activeLabel: {
    color: '#0878ff',
  },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0878ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0878ff',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#98a2b3',
    shadowOpacity: 0.08,
  },
});
