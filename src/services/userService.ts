import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseAuth, firebaseConfig, firebaseFunctions, firestore } from '@/config/firebase';
import type { UserProfile, UserRole } from '@/types/user';

const usersCollection = 'users';
const sparkManagedUserAppName = 'spark-managed-user-creation';
const useFirebaseFunctions = process.env.EXPO_PUBLIC_USE_FIREBASE_FUNCTIONS === 'true';

const userConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(user: UserProfile): DocumentData {
    return user;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserProfile {
    return snapshot.data(options) as UserProfile;
  },
};

function userRef(uid: string) {
  return doc(firestore, usersCollection, uid).withConverter(userConverter);
}

function getSparkManagedUserApp() {
  return getApps().some((app) => app.name === sparkManagedUserAppName)
    ? getApp(sparkManagedUserAppName)
    : initializeApp(firebaseConfig, sparkManagedUserAppName);
}

function usernameFromAuthUser(user: User) {
  const emailName = user.email?.trim().toLowerCase().split('@')[0];
  const baseName = emailName || user.displayName?.trim().toLowerCase() || 'admin';
  const username = baseName
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

  return username.length >= 3 ? username : `${username || 'admin'}_user`;
}

export async function createUserProfile(input: {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
}) {
  const now = serverTimestamp() as Timestamp;
  const usernameLower = input.username.trim().toLowerCase();
  const profile: UserProfile = {
    uid: input.uid,
    email: input.email,
    username: usernameLower,
    usernameLower,
    fullName: input.fullName,
    phone: null,
    role: input.role,
    profileImage: null,
    isVerified: input.isVerified,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef(input.uid), profile);
  return profile;
}

export async function createDefaultAdminProfileForAuthUser(user: User) {
  const existingProfile = await getUserProfile(user.uid);

  if (existingProfile) {
    return existingProfile;
  }

  const baseUsername = usernameFromAuthUser(user);
  const existingEmail = await getUsernameEmail(baseUsername);
  const username = existingEmail && existingEmail !== user.email
    ? `${baseUsername.slice(0, 21)}_${user.uid.slice(0, 8).toLowerCase()}`
    : baseUsername;
  const email = user.email?.trim().toLowerCase() ?? `${user.uid}@mamuyenativeapp.firebaseapp.com`;
  const profile = await createUserProfile({
    uid: user.uid,
    email,
    username,
    fullName: user.displayName?.trim() || username,
    role: 'admin',
    isVerified: user.emailVerified,
  });

  await createUsernameMapping({ username, uid: user.uid, email }).catch(() => undefined);

  return profile;
}

export async function getUsernameEmail(username: string) {
  const usernameLower = username.trim().toLowerCase();
  const snapshot = await getDoc(doc(firestore, 'usernames', usernameLower));
  return snapshot.exists() ? (snapshot.data().email as string | undefined) ?? null : null;
}

export async function createUsernameMapping(input: { username: string; uid: string; email: string }) {
  const usernameLower = input.username.trim().toLowerCase();
  await setDoc(doc(firestore, 'usernames', usernameLower), {
    uid: input.uid,
    email: input.email,
    username: usernameLower,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(userRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function syncUserVerification(uid: string, isVerified: boolean) {
  await updateDoc(userRef(uid), {
    isVerified,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'profileImage'>>
) {
  await updateDoc(userRef(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const currentUser = firebaseAuth.currentUser;

  if (currentUser?.uid === uid) {
    await updateProfile(currentUser, {
      displayName: updates.fullName,
      photoURL: updates.profileImage,
    });
  }
}

export function subscribeToUsers(onUsers: (users: UserProfile[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    query(collection(firestore, usersCollection), orderBy('createdAt', 'desc'), limit(100)).withConverter(userConverter),
    (snapshot) => onUsers(snapshot.docs.map((item) => item.data())),
    onError
  );
}

export async function updateManagedUser(
  uid: string,
  updates: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'role' | 'isActive' | 'profileImage'>>
) {
  await updateDoc(userRef(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updateManagedUserRole(uid: string, role: UserRole) {
  const callable = httpsCallable<
    { uid: string; role: UserRole },
    { uid: string; role: UserRole }
  >(firebaseFunctions, 'updateManagedUserRole');

  return callable({ uid, role });
}

export async function updateManagedUserRoleWithFallback(uid: string, role: UserRole) {
  try {
    await updateManagedUserRole(uid, role);
    return 'functions' as const;
  } catch {
    await updateManagedUser(uid, { role });
    return 'firestore' as const;
  }
}

export async function setManagedUserStatus(uid: string, isActive: boolean) {
  const callable = httpsCallable<
    { uid: string; isActive: boolean },
    { uid: string; isActive: boolean }
  >(firebaseFunctions, 'setManagedUserStatus');

  return callable({ uid, isActive });
}

export async function setManagedUserStatusWithFallback(uid: string, isActive: boolean) {
  try {
    await setManagedUserStatus(uid, isActive);
    return 'functions' as const;
  } catch {
    await updateManagedUser(uid, { isActive });
    return 'firestore' as const;
  }
}

export async function deleteManagedUser(uid: string) {
  const callable = httpsCallable<
    { uid: string },
    { uid: string; deleted: boolean }
  >(firebaseFunctions, 'deleteManagedUser');

  return callable({ uid });
}

export async function deleteManagedUserProfile(uid: string) {
  const profile = await getUserProfile(uid);
  await deleteDoc(userRef(uid));

  const username = profile?.usernameLower ?? profile?.username;

  if (username) {
    await deleteDoc(doc(firestore, 'usernames', username));
  }
}

export async function createManagedUser(input: {
  username: string;
  password: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
}) {
  const callable = httpsCallable<
    typeof input,
    { uid: string }
  >(firebaseFunctions, 'createManagedUser');

  return callable(input);
}

export async function createManagedUserOnSpark(input: {
  username: string;
  password: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
}) {
  const app = getSparkManagedUserApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const username = input.username.trim().toLowerCase();
  const email = `${username}@mamuyenativeapp.firebaseapp.com`;
  const credential = await createUserWithEmailAndPassword(auth, email, input.password);
  const now = serverTimestamp() as Timestamp;

  try {
    const profile: UserProfile = {
      uid: credential.user.uid,
      email,
      username,
      usernameLower: username,
      fullName: input.fullName.trim().replace(/\s+/g, ' '),
      phone: input.phone?.trim() || null,
      role: input.role,
      profileImage: null,
      isVerified: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, usersCollection, credential.user.uid), profile);
    await setDoc(doc(db, 'usernames', username), {
      uid: credential.user.uid,
      email,
      username,
      createdAt: now,
    });
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  } finally {
    await signOut(auth).catch(() => undefined);
  }

  return { data: { uid: credential.user.uid } };
}

export async function createManagedUserWithFallback(input: {
  username: string;
  password: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
}) {
  if (useFirebaseFunctions) {
    try {
      await createManagedUser(input);
      return 'functions' as const;
    } catch {
      await createManagedUserOnSpark(input);
      return 'spark' as const;
    }
  }

  await createManagedUserOnSpark(input);
  return 'spark' as const;
}
