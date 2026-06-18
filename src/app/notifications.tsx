import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/inventory/app-header';
import { MobileShell } from '@/components/inventory/mobile-shell';
import { ThemedText } from '@/components/themed-text';
import { useBusinessCollection } from '@/hooks/useBusinessCollection';
import { useAppSettings, useTranslation } from '@/hooks/useAppSettings';
import { clearViewedNotifications, subscribeToNotifications } from '@/services/businessService';
import { removeDisplayedNotifications } from '@/services/notificationService';
import type { NotificationRecord } from '@/types/business';

export default function NotificationsScreen() {
  const t = useTranslation();
  const { settings } = useAppSettings();
  const { items } = useBusinessCollection<NotificationRecord>(subscribeToNotifications);

  useEffect(() => {
    void removeDisplayedNotifications();

    if (settings.clearNotificationsAfterViewing) {
      const clearTimer = setTimeout(() => {
        void clearViewedNotifications();
      }, 1800);

      return () => clearTimeout(clearTimer);
    }

    return undefined;
  }, [settings.clearNotificationsAfterViewing]);

  return (
    <MobileShell>
      <AppHeader title={t('notifications')} left="back" right="none" onLeftPress={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<ThemedText style={styles.empty}>{t('noNotificationsYet')}</ThemedText>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText style={styles.title}>{item.title}</ThemedText>
            <ThemedText style={styles.body}>{item.body}</ThemedText>
          </View>
        )}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 24, gap: 10 },
  empty: { color: '#667085', textAlign: 'center', padding: 18 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#edf0f5', backgroundColor: '#fff', padding: 14, gap: 5 },
  title: { color: '#101828', fontSize: 15, fontWeight: '900' },
  body: { color: '#667085', fontSize: 13, fontWeight: '600' },
});
