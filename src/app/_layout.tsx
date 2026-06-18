import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';

const roleDashboardPaths = {
  admin: '/dashboard/admin',
  membe: '/dashboard/member',
  member: '/dashboard/member',
  manager: '/dashboard/manager',
  salesperson: '/dashboard/salesperson',
} as const;

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </AppThemeProvider>
    </AuthProvider>
  );
}

function AppThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const { settings } = useAppSettings();
  const activeTheme = settings.theme === 'system' ? colorScheme : settings.theme;

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
    </ThemeProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { initialized, loading, user, userProfile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const routeSegments = segments as readonly string[];
    const inAuthGroup = routeSegments[0] === '(auth)';
    const routeName = routeSegments[1];
    const isVerifyRoute = inAuthGroup && routeName === 'verify-email';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/login' as never);
      }
      return;
    }

    const isVerified = user.emailVerified || userProfile?.isVerified === true;

    if (!isVerified && !isVerifyRoute) {
      router.replace('/verify-email' as never);
      return;
    }

    if (isVerified && inAuthGroup) {
      router.replace((userProfile ? roleDashboardPaths[userProfile.role] : '/') as never);
    }
  }, [initialized, segments, user, userProfile]);

  if (!initialized || (loading && !user)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0878ff" size="large" />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8fb',
  },
});
