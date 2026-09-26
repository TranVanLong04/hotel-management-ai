import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { testConnection } from './config/supabase.js';

const PORT = env.PORT;

/**
 * Khởi động server.
 * 1. Test kết nối Supabase
 * 2. Listen trên PORT
 * 3. Setup graceful shutdown
 */
const startServer = async () => {
  try {
    // Test kết nối database trước khi accept requests
    await testConnection();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
    });

    // === Graceful shutdown ===
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });

      // Force exit sau 10s nếu server không close được
      setTimeout(() => {
        logger.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.fatal({ err: error }, '❌ Failed to start server');
    process.exit(1);
  }
};

// === Handle unhandled errors ===
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, '❌ Unhandled Promise Rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, '❌ Uncaught Exception');
  process.exit(1);
});

startServer();
