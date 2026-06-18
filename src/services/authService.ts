import {
  type ActionCodeSettings,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseAuth } from '@/config/firebase';
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
} from '@/validations/authSchemas';
import { getUsernameEmail, syncUserVerification } from './userService';

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

const verificationActionCodeSettings: ActionCodeSettings = {
  url:
    process.env.EXPO_PUBLIC_AUTH_CONTINUE_URL ??
    `https://${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}`,
  handleCodeInApp: false,
};

export async function sendVerificationEmail(user: User) {
  await sendEmailVerification(user, verificationActionCodeSettings);
}

export async function loginWithEmail(values: LoginFormValues) {
  const username = values.username.trim().toLowerCase();
  const email = await getUsernameEmail(username);

  if (!email) {
    throw new Error('No account was found for this username.');
  }

  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    cleanEmail(email),
    values.password
  );
  return credential.user;
}

export async function logoutUser() {
  await signOut(firebaseAuth);
}

export async function sendPasswordReset(values: ForgotPasswordFormValues) {
  const email = await getUsernameEmail(values.username);

  if (!email) {
    throw new Error('No account was found for this username.');
  }

  await sendPasswordResetEmail(firebaseAuth, cleanEmail(email));
}

export async function reloadUserAndSyncVerification(user: User) {
  await reload(user);
  if (user.emailVerified) {
    await syncUserVerification(user.uid, true);
  }
}
