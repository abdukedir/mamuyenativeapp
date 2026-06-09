import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type Timestamp,
} from 'firebase/firestore';

import { firestore } from '@/config/firebase';
import type { UserProfile, UserRole } from '@/types/user';

const usersCollection = 'users';

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

export async function createUserProfile(input: {
  uid: string;
  email: string;
  fullName: string;
  role: Exclude<UserRole, 'admin'>;
  isVerified: boolean;
}) {
  const now = serverTimestamp() as Timestamp;
  const profile: UserProfile = {
    uid: input.uid,
    email: input.email,
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
}
