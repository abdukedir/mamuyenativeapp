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
  'functions/already-exists': 'This user already exists.',
  'functions/invalid-argument': 'Check the form values and try again.',
  'functions/failed-precondition': 'Firebase could not create this user. Check the details and function logs.',
  'functions/internal': 'Firebase Functions returned an internal error. Deploy the latest functions and check Firebase function logs.',
  'functions/not-found': 'The Firebase user-management function is not deployed. Run: firebase deploy --only functions',
  'functions/permission-denied': 'Only active registered users can perform this action. Check your users/{uid} isActive field.',
  'functions/unauthenticated': 'Sign in again before managing users.',
  'functions/unavailable': 'Firebase Functions is unavailable. Check your connection and try again.',
  unavailable: 'The service is unavailable. Try again shortly.',
};

export function getFirebaseErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === 'functions/failed-precondition' && error.message) {
      return error.message;
    }

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
