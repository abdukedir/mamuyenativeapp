import AsyncStorage from '@react-native-async-storage/async-storage';
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
  registerWithEmail,
  reloadUserAndSyncVerification,
  sendVerificationEmail,
  sendPasswordReset,
} from '@/services/authService';
import { getUserProfile, syncUserVerification } from '@/services/userService';
import type { AuthContextValue } from '@/types/auth';
import type { UserProfile } from '@/types/user';
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
} from '@/validations/authSchemas';

const USER_PROFILE_CACHE_KEY = '@mamuye/auth/user-profile';

export const AuthContext = createContext<AuthContextValue | null>(null);

async function clearProfileCache() {
  await AsyncStorage.removeItem(USER_PROFILE_CACHE_KEY);
}

async function cacheProfile(profile: UserProfile | null) {
  if (!profile) {
    await clearProfileCache();
    return;
  }

  const createdAt =
    typeof profile.createdAt.toDate === 'function'
      ? profile.createdAt.toDate().toISOString()
      : new Date().toISOString();
  const updatedAt =
    typeof profile.updatedAt.toDate === 'function'
      ? profile.updatedAt.toDate().toISOString()
      : new Date().toISOString();

  await AsyncStorage.setItem(
    USER_PROFILE_CACHE_KEY,
    JSON.stringify({
      ...profile,
      createdAt,
      updatedAt,
    })
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUserProfile(null);
      await clearProfileCache();
      return;
    }

    const profile = await getUserProfile(authUser.uid);

    if (profile && profile.isVerified !== authUser.emailVerified) {
      await syncUserVerification(authUser.uid, authUser.emailVerified);
      profile.isVerified = authUser.emailVerified;
    }

    setUserProfile(profile);
    await cacheProfile(profile);
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
      } finally {
        setLoading(false);
      }
    },
    [loadUserProfile]
  );

  const register = useCallback(
    async (values: RegisterFormValues) => {
      setLoading(true);

      try {
        const authUser = await registerWithEmail(values);
        setUser(authUser);
        await loadUserProfile(authUser);
      } finally {
        setLoading(false);
      }
    },
    [loadUserProfile]
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
      await clearProfileCache();
    } finally {
      setLoading(false);
    }
  }, []);

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
      await clearProfileCache();
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
      register,
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
      register,
      logout,
      resetPassword,
      resendEmailVerification,
      refreshUserProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
