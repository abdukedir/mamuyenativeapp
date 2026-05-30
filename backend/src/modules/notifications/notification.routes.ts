import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { notificationController } from './notification.controller';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get('/', notificationController.list);
