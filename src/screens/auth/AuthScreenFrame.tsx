import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type AuthScreenFrameProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthScreenFrame({ title, subtitle, children }: AuthScreenFrameProps) {
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.brandMark}>
              <ThemedText style={styles.brandText}>M</ThemedText>
            </View>
            <View style={styles.header}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0878ff',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  header: {
    gap: 8,
  },
  title: {
    color: '#101828',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  subtitle: {
    color: '#667085',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});
