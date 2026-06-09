import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/inventory/app-header';
import { BottomNav } from '@/components/inventory/bottom-nav';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';

type ActionScreenProps = {
  title: string;
  description: string;
  activeTab?: 'home' | 'products' | 'expenses' | 'more';
  children?: ReactNode;
};

export function ActionScreen({ title, description, activeTab = 'more', children }: ActionScreenProps) {
  return (
    <MobileShell>
      <AppHeader title={title} left="back" onLeftPress={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.panel}>
          <View style={styles.iconWrap}>
            <ChevronLeft color="#0878ff" size={28} />
          </View>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.description}>{description}</ThemedText>
          {children}
          <Pressable onPress={() => router.push('/')} style={styles.button}>
            <ThemedText style={styles.buttonText}>Back to Dashboard</ThemedText>
          </Pressable>
        </View>
      </View>
      <BottomNav active={activeTab} />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 82,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#10172a',
    textAlign: 'center',
  },
  description: {
    color: '#667085',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0878ff',
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
