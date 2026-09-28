import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// === Security headers ===
app.use(helmet());

// === CORS — whitelist frontend dev server ===
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

// === Parse JSON body (limit 10mb cho ảnh base64 nếu cần) ===
app.use(express.json({ limit: '10mb' }));

// === Parse URL-encoded ===
app.use(express.urlencoded({ extended: true }));

// === HTTP request logging qua morgan → stream vào Pino ===
const morganStream = {
  write: (message) => {
    // morgan thêm \n cuối dòng, cần trim
    logger.info(message.trim());
  },
};
app.use(morgan('short', { stream: morganStream }));

// === Health check endpoint ===
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// === Mount routes ===
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import roomTypesRoutes from './modules/room-types/room-types.routes.js';
import roomsRoutes from './modules/rooms/rooms.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import facesRoutes from './modules/face-profiles/faces.routes.js';
import checkinRoutes from './modules/checkin/checkin.routes.js';
import checkoutRoutes from './modules/checkout/checkout.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/room-types', roomTypesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/faces', facesRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/checkout', checkoutRoutes);

// === 404 handler — phải đặt sau tất cả routes ===
app.use(notFoundHandler);

// === Global error handler — phải đặt cuối cùng ===
app.use(errorHandler);

export default app;
