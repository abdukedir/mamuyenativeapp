import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { corsOrigins, env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { apiRateLimiter } from './middlewares/rate-limit.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { productRoutes } from './modules/products/product.routes';
import { saleRoutes } from './modules/sales/sale.routes';
import { supplierRoutes } from './modules/suppliers/supplier.routes';

export const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(apiRateLimiter);
app.use('/uploads', express.static(env.UPLOAD_DIR));

const apiPrefix = `/api/${env.API_VERSION}`;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'electrostock-api' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/inventory`, inventoryRoutes);
app.use(`${apiPrefix}/sales`, saleRoutes);
app.use(`${apiPrefix}/suppliers`, supplierRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
