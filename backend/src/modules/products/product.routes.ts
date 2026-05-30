import { Role } from '@prisma/client';
import { Router } from 'express';

import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { productController } from './product.controller';
import { productCreateSchema, productListSchema, productUpdateSchema } from './product.schemas';

export const productRoutes = Router();

productRoutes.use(authenticate);
productRoutes.get('/', validate(productListSchema), productController.list);
productRoutes.get('/:id', productController.get);
productRoutes.post(
  '/',
  authorize(Role.ADMIN, Role.STORE_MANAGER),
  upload.single('image'),
  validate(productCreateSchema),
  productController.create,
);
productRoutes.patch(
  '/:id',
  authorize(Role.ADMIN, Role.STORE_MANAGER),
  upload.single('image'),
  validate(productUpdateSchema),
  productController.update,
);
productRoutes.delete('/:id', authorize(Role.ADMIN, Role.STORE_MANAGER), productController.remove);
