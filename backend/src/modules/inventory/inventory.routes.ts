import { Role } from '@prisma/client';
import { Router } from 'express';

import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { inventoryController } from './inventory.controller';
import { inventoryListSchema, inventoryMutationSchema } from './inventory.schemas';

export const inventoryRoutes = Router();

inventoryRoutes.use(authenticate);
inventoryRoutes.get('/', validate(inventoryListSchema), inventoryController.list);
inventoryRoutes.post(
  '/',
  authorize(Role.ADMIN, Role.STORE_MANAGER),
  validate(inventoryMutationSchema),
  inventoryController.create,
);
