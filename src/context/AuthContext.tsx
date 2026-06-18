import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { firebaseAuth } from '@/config/firebase';
import {
  loginWithEmail,
  logoutUser,
  reloadUserAndSyncVerification,
  sendVerificationEmail,
  sendPasswordReset,
} from '@/services/authService';
import {
  createDefaultAdminProfileForAuthUser,
  getUserProfile,
  syncUserVerification,
} from '@/services/userService';
import { safeLogActivity } from '@/services/businessService';
import { registerForPushNotifications } from '@/services/notificationService';
import type { AuthContextValue } from '@/types/auth';
import type { UserProfile } from '@/types/user';
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
} from '@/validations/authSchemas';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUserProfile(null);
      return;
    }

    let profile = await getUserProfile(authUser.uid);

    if (!profile) {
      profile = await createDefaultAdminProfileForAuthUser(authUser);
    }

    if (profile && authUser.emailVerified && !profile.isVerified) {
      await syncUserVerification(authUser.uid, true);
      profile.isVerified = true;
    }

    setUserProfile(profile);
    if (profile?.isActive) {
      await registerForPushNotifications(profile).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (authUser) => {
      setLoading(true);

      try {
        setUser(authUser);
        await loadUserProfile(authUser);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadUserProfile]);

  const login = useCallback(
    async (values: LoginFormValues) => {
      setLoading(true);

      try {
        const authUser = await loginWithEmail(values);
        setUser(authUser);
        await loadUserProfile(authUser);
        const profile = await getUserProfile(authUser.uid);
        await safeLogActivity(profile, 'login');
      } finally {
        setLoading(false);
      }
    },
    [loadUserProfile]
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      const profile = userProfile;
      setUser(null);
      setUserProfile(null);
      await safeLogActivity(profile, 'logout');
      await logoutUser();
    } finally {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, [userProfile]);

  const resetPassword = useCallback(async (values: ForgotPasswordFormValues) => {
    await sendPasswordReset(values);
  }, []);

  const resendEmailVerification = useCallback(async () => {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      throw new Error('Sign in before requesting verification.');
    }

    await sendVerificationEmail(currentUser);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      setUser(null);
      setUserProfile(null);
      return;
    }

    await reloadUserAndSyncVerification(currentUser);
    setUser(currentUser);
    await loadUserProfile(currentUser);
  }, [loadUserProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userProfile,
      loading,
      initialized,
      login,
      logout,
      resetPassword,
      resendEmailVerification,
      refreshUserProfile,
    }),
    [
      user,
      userProfile,
      loading,
      initialized,
      login,
      logout,
      resetPassword,
      resendEmailVerification,
      refreshUserProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
