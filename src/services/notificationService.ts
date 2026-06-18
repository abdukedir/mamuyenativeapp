import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

import { firestore } from '@/config/firebase';
import type { AppSettings } from '@/types/business';
import type { UserProfile } from '@/types/user';

let notificationSoundEnabled = true;
let notificationsEnabled = true;
let notificationSoundName = 'default';

function normalizeNotificationSoundName(soundName: string | null | undefined) {
  const cleanName = soundName?.trim();
  return cleanName || 'default';
}

function getNotificationSound() {
  return notificationSoundEnabled ? notificationSoundName : undefined;
}

function getNotificationChannelId() {
  return `stock-alerts-${notificationSoundName.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function setNotificationSoundEnabled(enabled: boolean) {
  notificationSoundEnabled = enabled;
}

export function setNotificationSoundName(soundName: string | null | undefined) {
  notificationSoundName = normalizeNotificationSoundName(soundName);
}

export function setNotificationsEnabled(enabled: boolean) {
  notificationsEnabled = enabled;
}

export function getAvailableNotificationSounds() {
  const extraSounds = Constants.expoConfig?.extra?.notificationSounds;
  const soundNames = Array.isArray(extraSounds)
    ? extraSounds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  return Array.from(new Set(['default', ...soundNames.map(normalizeNotificationSoundName)]));
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return undefined;
  }

  const channelId = getNotificationChannelId();

  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Stock Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: getNotificationSound(),
    vibrationPattern: [0, 250, 250, 250],
  });

  return channelId;
}

export async function showLocalNotification(title: string, body: string) {
  if (!notificationsEnabled) {
    return;
  }

  const channelId = await ensureAndroidNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: getNotificationSound(),
    },
    trigger: channelId
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId,
        }
      : null,
  }).catch(() => undefined);
}

export async function removeDisplayedNotifications() {
  await Notifications.dismissAllNotificationsAsync().catch(() => undefined);
  await Notifications.setBadgeCountAsync(0).catch(() => undefined);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: notificationSoundEnabled,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(user: UserProfile) {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await ensureAndroidNotificationChannel();
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const nativeToken = await Notifications.getDevicePushTokenAsync();
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
  const expoToken = projectId
    ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
    : null;

  await setDoc(
    doc(firestore, 'users', user.uid),
    {
      pushTokens: {
        native: nativeToken.data,
        expo: expoToken,
        platform: Platform.OS,
        updatedAt: new Date().toISOString(),
      },
      notificationSettings: {
        enabled: true,
        sound: true,
        soundName: notificationSoundName,
        clearAfterViewing: true,
        minimumStockLevel: 5,
        criticalStockLevel: 2,
        dailyReminder: false,
      },
    },
    { merge: true }
  );

  return nativeToken.data;
}

export async function updateUserNotificationSettings(
  userId: string,
  updates: Partial<Pick<AppSettings, 'notificationsEnabled' | 'notificationSound' | 'notificationSoundName' | 'clearNotificationsAfterViewing' | 'minimumStockLevel' | 'criticalStockLevel' | 'dailyReminder'>>
) {
  if (updates.notificationsEnabled !== undefined) {
    setNotificationsEnabled(updates.notificationsEnabled);
  }
  setNotificationSoundEnabled(updates.notificationSound !== false);
  setNotificationSoundName(updates.notificationSoundName);
  await ensureAndroidNotificationChannel();

  await updateDoc(doc(firestore, 'users', userId), {
    notificationSettings: {
      enabled: updates.notificationsEnabled,
      sound: updates.notificationSound,
      soundName: updates.notificationSoundName,
      clearAfterViewing: updates.clearNotificationsAfterViewing,
      minimumStockLevel: updates.minimumStockLevel,
      criticalStockLevel: updates.criticalStockLevel,
      dailyReminder: updates.dailyReminder,
    },
  });
}
