import type { Role } from '@prisma/client';
import type { RequestHandler } from 'express';

import { firebaseAdminAuth } from '../config/firebase';
import { ApiError } from '../utils/api-error';

const roles: Role[] = ['ADMIN', 'STORE_MANAGER', 'SALES_PERSON'];

function resolveRole(role: unknown): Role {
  return typeof role === 'string' && roles.includes(role as Role) ? (role as Role) : 'SALES_PERSON';
}

export const authenticateFirebase: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new ApiError(401, 'Firebase ID token is required');
    }

    const decodedToken = await firebaseAdminAuth.verifyIdToken(token);
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email ?? '',
      role: resolveRole(decodedToken.role),
    };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid Firebase ID token'));
  }
};
