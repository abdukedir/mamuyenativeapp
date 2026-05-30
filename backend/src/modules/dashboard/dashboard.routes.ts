import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { dashboardController } from './dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);
dashboardRoutes.get('/summary', dashboardController.summary);
