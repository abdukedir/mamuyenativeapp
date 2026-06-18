import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { auth } from "firebase-functions/v1";
import { logger, setGlobalOptions } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

type Product = {
  name?: string;
  stock?: number;
  minimumStockLevel?: number;
  criticalStockLevel?: number;
};

type UserProfileDocument = {
  email?: string;
  username?: string;
  usernameLower?: string;
  fullName?: string;
  phone?: string | null;
  role?: "admin" | "member" | "manager" | "salesperson";
  isActive?: boolean;
  profileImage?: string | null;
};

type ManagedUserInput = {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
  phone?: string | null;
  role?: "admin" | "member" | "manager" | "salesperson";
};

type ManagedUserUpdateInput = {
  uid?: string;
  role?: "admin" | "member" | "manager" | "salesperson";
  isActive?: boolean;
};

function firebaseAdminErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" || typeof code === "number" ? code : undefined;
  }

  return undefined;
}

function firebaseAdminErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

function throwManagedUserError(error: unknown): never {
  if (error instanceof HttpsError) {
    throw error;
  }

  const code = firebaseAdminErrorCode(error);
  const message = firebaseAdminErrorMessage(error);

  if (code === "auth/email-already-exists") {
    throw new HttpsError("already-exists", "A Firebase Auth account already exists for this username.");
  }

  if (code === "auth/invalid-email") {
    throw new HttpsError("invalid-argument", "The generated user email is invalid.");
  }

  if (code === "auth/invalid-password") {
    throw new HttpsError("invalid-argument", "Temporary password must be at least 6 characters.");
  }

  if (code === "auth/insufficient-permission") {
    throw new HttpsError("permission-denied", "The deployed function does not have permission to manage Firebase Auth users.");
  }

  logger.error("createManagedUser failed", { code, message });
  throw new HttpsError("failed-precondition", message || "User creation failed in Firebase Functions. Check function logs.");
}

function isAlreadyExistsError(error: unknown) {
  const code = firebaseAdminErrorCode(error);
  return code === 6 || code === "already-exists" || code === "firestore/already-exists";
}

function normalizeUsername(user?: UserProfileDocument) {
  const username = user?.usernameLower || user?.username;
  return typeof username === "string" ? username.trim().toLowerCase() : undefined;
}

function normalizeEmail(email?: string) {
  return typeof email === "string" ? email.trim().toLowerCase() : undefined;
}

function usernameFromEmail(email?: string) {
  const localPart = normalizeEmail(email)?.split("@")[0] ?? "admin";
  const username = localPart
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

  return username.length >= 3 ? username : `${username || "admin"}_user`;
}

async function assertActiveUser(uid?: string) {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in before using this action.");
  }

  const user = await getFirestore().collection("users").doc(uid).get();
  const data = user.data();

  if (!data || data.isActive === false) {
    throw new HttpsError("permission-denied", "Only active registered users can use this action.");
  }
}

async function assertMemberAccess(uid?: string) {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in before managing users.");
  }

  const user = await getFirestore().collection("users").doc(uid).get();
  const data = user.data();

  if (!data) {
    throw new HttpsError("permission-denied", "Only active members can manage users.");
  }

  const role = typeof data.role === "string" ? data.role.trim().toLowerCase() : "";

  if (data.isActive === false || !["member", "admin", "membe"].includes(role)) {
    throw new HttpsError("permission-denied", "Only active members can manage users.");
  }
}

export const createDefaultAdminProfileForAuthUser = auth.user().onCreate(async (user) => {
  const db = getFirestore();
  const userRef = db.collection("users").doc(user.uid);
  const userSnapshot = await userRef.get();

  if (userSnapshot.exists) {
    return;
  }

  const now = new Date();
  const email = normalizeEmail(user.email) || `${user.uid}@mamuyenativeapp.firebaseapp.com`;
  const baseUsername = usernameFromEmail(email);
  let username = baseUsername;
  let usernameRef = db.collection("usernames").doc(username);
  let usernameSnapshot = await usernameRef.get();
  let attempts = 0;

  while (usernameSnapshot.exists && usernameSnapshot.data()?.uid !== user.uid && attempts < 5) {
    attempts += 1;
    username = `${baseUsername.slice(0, 21)}_${user.uid.slice(0, 8).toLowerCase()}`;
    if (attempts > 1) {
      username = `${baseUsername.slice(0, 18)}_${user.uid.slice(0, 8).toLowerCase()}_${attempts}`;
    }
    usernameRef = db.collection("usernames").doc(username);
    usernameSnapshot = await usernameRef.get();
  }

  if (usernameSnapshot.exists && usernameSnapshot.data()?.uid !== user.uid) {
    username = `${user.uid.slice(0, 28).toLowerCase()}`;
    usernameRef = db.collection("usernames").doc(username);
  }

  try {
    await userRef.create({
      uid: user.uid,
      email,
      username,
      usernameLower: username,
      fullName: user.displayName?.trim() || username,
      phone: user.phoneNumber ?? null,
      role: "admin",
      profileImage: user.photoURL ?? null,
      isVerified: user.emailVerified,
      isActive: !user.disabled,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return;
    }

    throw error;
  }

  await usernameRef.set({
    uid: user.uid,
    email,
    username,
    createdAt: now,
    updatedAt: now,
  });
  await getAuth().setCustomUserClaims(user.uid, { role: "admin", username, isActive: !user.disabled });
});

export const createManagedUser = onCall(async (request) => {
  let createdAuthUid: string | undefined;

  try {
    await assertMemberAccess(request.auth?.uid);

    const input = request.data as ManagedUserInput;
    const db = getFirestore();
    const username = input.username?.trim().toLowerCase();
    const email = input.email?.trim().toLowerCase() || (username ? `${username}@mamuyenativeapp.firebaseapp.com` : undefined);
    const fullName = input.fullName?.trim().replace(/\s+/g, " ");
    const phone = input.phone?.trim() || null;
    const role = input.role;

    if (!username || !email || !fullName || !input.password || !role) {
      throw new HttpsError("invalid-argument", "Username, password, full name, and role are required.");
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new HttpsError("invalid-argument", "Use a valid username.");
    }

    if (!["admin", "member", "manager", "salesperson"].includes(role)) {
      throw new HttpsError("invalid-argument", "Invalid role.");
    }

    if (input.password.length < 6) {
      throw new HttpsError("invalid-argument", "Temporary password must be at least 6 characters.");
    }

    const usernameRef = db.collection("usernames").doc(username);
    const usernameSnapshot = await usernameRef.get();

    if (usernameSnapshot.exists) {
      throw new HttpsError("already-exists", "This username is already registered.");
    }

    try {
      await getAuth().getUserByEmail(email);
      throw new HttpsError("already-exists", "A Firebase Auth account already exists for this username.");
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      const code = firebaseAdminErrorCode(error);
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    const authUser = await getAuth().createUser({
      email,
      password: input.password,
      displayName: fullName,
      emailVerified: true,
      disabled: false,
    });
    createdAuthUid = authUser.uid;

    const now = new Date();
    const batch = db.batch();

    batch.set(db.collection("users").doc(authUser.uid), {
      uid: authUser.uid,
      email,
      username,
      usernameLower: username,
      fullName,
      phone,
      role,
      profileImage: null,
      isVerified: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(usernameRef, {
      uid: authUser.uid,
      email,
      username,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
    await getAuth().setCustomUserClaims(authUser.uid, { role, username, isActive: true });
    return { uid: authUser.uid };
  } catch (error) {
    if (createdAuthUid) {
      await getAuth().deleteUser(createdAuthUid).catch(() => undefined);
    }

    throwManagedUserError(error);
  }
});

export const updateManagedUserRole = onCall(async (request) => {
  await assertMemberAccess(request.auth?.uid);

  const input = request.data as ManagedUserUpdateInput;

  if (!input.uid || !input.role || !["admin", "member", "manager", "salesperson"].includes(input.role)) {
    throw new HttpsError("invalid-argument", "User id and valid role are required.");
  }

  await getFirestore().collection("users").doc(input.uid).update({
    role: input.role,
    updatedAt: new Date(),
  });

  return { uid: input.uid, role: input.role };
});

export const setManagedUserStatus = onCall(async (request) => {
  await assertMemberAccess(request.auth?.uid);

  const input = request.data as ManagedUserUpdateInput;

  if (!input.uid || typeof input.isActive !== "boolean") {
    throw new HttpsError("invalid-argument", "User id and active status are required.");
  }

  await getAuth().updateUser(input.uid, { disabled: !input.isActive });
  await getFirestore().collection("users").doc(input.uid).update({
    isActive: input.isActive,
    updatedAt: new Date(),
  });

  return { uid: input.uid, isActive: input.isActive };
});

export const deleteManagedUser = onCall(async (request) => {
  await assertMemberAccess(request.auth?.uid);

  const input = request.data as ManagedUserUpdateInput;

  if (!input.uid) {
    throw new HttpsError("invalid-argument", "User id is required.");
  }

  if (input.uid === request.auth?.uid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own account while signed in.");
  }

  const userDoc = await getFirestore().collection("users").doc(input.uid).get();
  const username = userDoc.data()?.usernameLower || userDoc.data()?.username;

  await getAuth().deleteUser(input.uid);
  await getFirestore().collection("users").doc(input.uid).delete();

  if (typeof username === "string" && username.length > 0) {
    await getFirestore().collection("usernames").doc(username).delete();
  }

  return { uid: input.uid, deleted: true };
});

export const syncUserProfileToAuth = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const before = event.data?.before.data() as UserProfileDocument | undefined;
  const after = event.data?.after.data() as UserProfileDocument | undefined;
  const db = getFirestore();

  if (!after) {
    const oldUsername = normalizeUsername(before);

    if (oldUsername) {
      await db.collection("usernames").doc(oldUsername).delete();
    }

    return;
  }

  const fullName = typeof after.fullName === "string" ? after.fullName.trim().replace(/\s+/g, " ") : undefined;
  const email = normalizeEmail(after.email);
  const username = normalizeUsername(after);
  const oldUsername = normalizeUsername(before);
  const role = after.role;
  const isActive = after.isActive !== false;
  const authUpdates: {
    displayName?: string;
    email?: string;
    disabled?: boolean;
    photoURL?: string;
  } = {};

  if (fullName && fullName !== before?.fullName) {
    authUpdates.displayName = fullName;
  }

  if (email && email !== normalizeEmail(before?.email)) {
    authUpdates.email = email;
  }

  if (after.profileImage && after.profileImage !== before?.profileImage) {
    authUpdates.photoURL = after.profileImage;
  }

  if (after.isActive !== before?.isActive) {
    authUpdates.disabled = !isActive;
  }

  if (Object.keys(authUpdates).length > 0) {
    await getAuth().updateUser(uid, authUpdates);
  }

  if (role && role !== before?.role) {
    await getAuth().setCustomUserClaims(uid, { role, username, isActive });
  }

  if (username && (username !== oldUsername || email !== normalizeEmail(before?.email))) {
    await db.collection("usernames").doc(username).set(
      {
        uid,
        email: email || `${username}@mamuyenativeapp.firebaseapp.com`,
        username,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  if (oldUsername && username && oldUsername !== username) {
    await db.collection("usernames").doc(oldUsername).delete();
  }
});

export const requestFirestoreBackup = onCall(async (request) => {
  await assertActiveUser(request.auth?.uid);

  const backup = await getFirestore().collection("backupRequests").add({
    requestedBy: request.auth?.uid,
    status: "requested",
    type: "firestore",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: backup.id, status: "requested" };
});

export const requestFirestoreRestore = onCall(async (request) => {
  await assertActiveUser(request.auth?.uid);

  const restore = await getFirestore().collection("restoreRequests").add({
    requestedBy: request.auth?.uid,
    status: "requested",
    type: "firestore",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: restore.id, status: "requested" };
});

export const sendLowStockAlert = onDocumentWritten("products/{productId}", async (event) => {
  const after = event.data?.after.data() as Product | undefined;
  const before = event.data?.before.data() as Product | undefined;

  if (!after || typeof after.stock !== "number") {
    return;
  }

  const minimum = typeof after.minimumStockLevel === "number" ? after.minimumStockLevel : 5;
  const previousStock = typeof before?.stock === "number" ? before.stock : Number.MAX_SAFE_INTEGER;

  if (after.stock > minimum || previousStock <= minimum) {
    return;
  }

  const body = `${after.name ?? "Product"} stock is below minimum level.`;
  const db = getFirestore();

  const users = await db
    .collection("users")
    .where("isActive", "==", true)
    .where("notificationSettings.enabled", "==", true)
    .get();

  const tokens = users.docs
    .map((user) => user.data().pushTokens?.native)
    .filter((token): token is string => typeof token === "string" && token.length > 0);

  await db.collection("notifications").add({
    title: "Low Stock Alert",
    body,
    productId: event.params.productId,
    read: false,
    createdAt: new Date(),
  });

  if (!tokens.length) {
    return;
  }

  await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "Low Stock Alert",
      body,
    },
    android: {
      notification: {
        channelId: "stock-alerts",
        sound: "default",
      },
    },
    data: {
      url: "/notifications",
      productId: event.params.productId,
      type: "low_stock",
    },
  });
});
