import type { User } from 'firebase/auth';

import type {
  ForgotPasswordFormValues,
  LoginFormValues,
} from '@/validations/authSchemas';
import type { UserProfile } from './user';

export type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (values: ForgotPasswordFormValues) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

export type AuthActionResult = {
  success: boolean;
  message?: string;
};
