import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

const roleDashboardPaths = {
  admin: '/dashboard/admin',
  sales: '/dashboard/sales',
  stock_manager: '/dashboard/stock-manager',
} as const;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </AuthProvider>
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

    if (!user.emailVerified && !isVerifyRoute) {
      router.replace('/verify-email' as never);
      return;
    }

    if (user.emailVerified && inAuthGroup) {
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
