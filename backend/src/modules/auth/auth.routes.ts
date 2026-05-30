import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { authController } from './auth.controller';
import { changePasswordSchema, loginSchema, refreshSchema } from './auth.schemas';

export const authRoutes = Router();

authRoutes.post('/login', authRateLimiter, validate(loginSchema), authController.login);
authRoutes.post('/refresh', authRateLimiter, validate(refreshSchema), authController.refresh);
authRoutes.post('/logout', validate(refreshSchema), authController.logout);
authRoutes.get('/profile', authenticate, authController.profile);
authRoutes.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
