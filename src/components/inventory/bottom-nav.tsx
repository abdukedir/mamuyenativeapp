import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Home, MoreHorizontal, Package, Plus } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ActiveTab = 'home' | 'products' | 'alerts' | 'more';

const tabs = [
  { id: 'home', label: 'Home', Icon: Home, href: '/' },
  { id: 'products', label: 'Products', Icon: Package, href: '/explore' },
  { id: 'alerts', label: 'Alerts', Icon: Bell, href: '/alerts' },
  { id: 'more', label: 'More', Icon: MoreHorizontal, href: '/more' },
] as const;

export function BottomNav({ active }: { active: ActiveTab }) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {tabs.slice(0, 2).map((tab) => (
        <NavItem key={tab.id} tab={tab} active={active === tab.id} color={theme.text} />
      ))}
      <Pressable onPress={() => router.push('/add-product')} style={styles.addButton}>
        <Plus color="#fff" size={34} strokeWidth={2.2} />
      </Pressable>
      {tabs.slice(2).map((tab) => (
        <NavItem key={tab.id} tab={tab} active={active === tab.id} color={theme.text} />
      ))}
    </View>
  );
}

function NavItem({
  tab,
  active,
  color,
}: {
  tab: (typeof tabs)[number];
  active: boolean;
  color: string;
}) {
  const Icon = tab.Icon;

  return (
    <Pressable onPress={() => router.push(tab.href)} style={styles.item}>
      <Icon color={active ? '#0878ff' : color} size={22} strokeWidth={active ? 2.6 : 2.1} />
      <ThemedText style={[styles.label, active && styles.activeLabel]}>{tab.label}</ThemedText>
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
});
