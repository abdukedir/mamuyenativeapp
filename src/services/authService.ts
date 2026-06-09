import {
  type ActionCodeSettings,
  createUserWithEmailAndPassword,
  deleteUser,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { firebaseAuth } from '@/config/firebase';
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
} from '@/validations/authSchemas';
import { createUserProfile, syncUserVerification } from './userService';

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

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

export async function registerWithEmail(values: RegisterFormValues) {
  const email = cleanEmail(values.email);
  const fullName = cleanText(values.fullName);
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, values.password);

  try {
    await updateProfile(credential.user, { displayName: fullName });
    await createUserProfile({
      uid: credential.user.uid,
      email,
      fullName,
      role: values.role,
      isVerified: credential.user.emailVerified,
    });
    await sendVerificationEmail(credential.user);
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }

  return credential.user;
}

export async function loginWithEmail(values: LoginFormValues) {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    cleanEmail(values.email),
    values.password
  );
  return credential.user;
}

export async function logoutUser() {
  await signOut(firebaseAuth);
}

export async function sendPasswordReset(values: ForgotPasswordFormValues) {
  await sendPasswordResetEmail(firebaseAuth, cleanEmail(values.email));
}

export async function reloadUserAndSyncVerification(user: User) {
  await reload(user);
  await syncUserVerification(user.uid, user.emailVerified);
}
