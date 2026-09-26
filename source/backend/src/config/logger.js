import pino from 'pino';
import { env } from './env.js';

// Cấu hình Pino logger
// Dev: pino-pretty (colorize, thời gian dễ đọc)
// Prod: JSON logs (cho log aggregator)
const loggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',

  // Ẩn sensitive fields — KHÔNG log password, token, v.v.
  redact: {
    paths: [
      'password',
      'password_hash',
      'token',
      'authorization',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },

  // Format timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Chỉ dùng pino-pretty ở dev (transport riêng)
if (env.NODE_ENV === 'development') {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(loggerOptions);
