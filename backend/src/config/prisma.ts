import { PrismaClient } from '@prisma/client';

import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (event) => {
  logger.error(event.message);
});

prisma.$on('warn', (event) => {
  logger.warn(event.message);
});
