import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

const startServer = async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    const server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        logger.info('Closed connections. Exiting process.');
        process.exit(0);
      });
      
      // Force close if taking too long
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// ─── Process-level crash guards ─────────────────────────────────────────────
// Without these, a single unhandled async error will silently crash the process.
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception — shutting down');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled Promise Rejection — shutting down');
  process.exit(1);
});

startServer();
