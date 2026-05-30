import { env } from './config/env';
import { prisma } from './config/prisma';
import { app } from './app';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`ElectroStock API running on port ${env.PORT}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
