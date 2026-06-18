import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Bell, ChevronLeft, Menu, Search, SlidersHorizontal } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type AppHeaderProps = {
  title: string;
  left?: 'menu' | 'back';
  right?: 'search' | 'filter' | 'bell' | 'none';
  badge?: number;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  rightContent?: ReactNode;
};

export function AppHeader({
  title,
  left = 'menu',
  right = 'none',
  badge,
  onLeftPress,
  onRightPress,
  rightContent,
}: AppHeaderProps) {
  const theme = useTheme();
  const LeftIcon = left === 'back' ? ChevronLeft : Menu;
  const RightIcon = right === 'search' ? Search : right === 'filter' ? SlidersHorizontal : Bell;
  const handleLeftPress = onLeftPress ?? (() => left === 'menu' && router.push('/more'));
  const handleRightPress = onRightPress ?? (() => right === 'bell' && router.push('/alerts'));

  return (
    <View style={styles.header}>
      <Pressable onPress={handleLeftPress} style={styles.iconButton}>
        <LeftIcon color={theme.text} size={24} strokeWidth={2.25} />
      </Pressable>

      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>

      {rightContent ? (
        <View style={styles.customRightWrap}>{rightContent}</View>
      ) : right === 'none' ? (
        <View style={styles.rightWrap} />
      ) : (
        <Pressable onPress={handleRightPress} style={styles.rightWrap}>
          <RightIcon color={theme.text} size={23} strokeWidth={2.2} />
          {!!badge && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{badge}</ThemedText>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  rightWrap: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  customRightWrap: {
    minWidth: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#ff354a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
});
