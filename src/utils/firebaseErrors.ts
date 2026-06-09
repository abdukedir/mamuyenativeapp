import { FirebaseError } from 'firebase/app';

const authErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'An account already exists for this email address.',
  'auth/configuration-not-found':
    'Firebase Authentication is not enabled for this project. In Firebase Console, open Authentication > Sign-in method and enable Email/Password.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account was found for this email address.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'permission-denied': 'You do not have permission to perform this action.',
  unavailable: 'The service is unavailable. Try again shortly.',
};

export function getFirebaseErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return authErrorMessages[error.code] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function assertClientRoleChangeBlocked() {
  throw new Error('Client-side role changes are not allowed.');
}
