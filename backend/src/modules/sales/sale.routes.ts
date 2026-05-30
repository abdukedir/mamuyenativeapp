import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { saleController } from './sale.controller';
import { saleCreateSchema, saleListSchema } from './sale.schemas';

export const saleRoutes = Router();

saleRoutes.use(authenticate);
saleRoutes.get('/', validate(saleListSchema), saleController.list);
saleRoutes.get('/:id', saleController.get);
saleRoutes.post('/', validate(saleCreateSchema), saleController.create);
