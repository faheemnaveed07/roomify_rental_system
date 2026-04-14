import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';

import path from 'path';
import routes from './routes/index';
import { connectDatabase } from './config/database';
import { logger, httpLogStream } from './utils/logger';
import errorMiddleware from './middleware/error.middleware';
import { csrfMiddleware } from './middleware/csrf.middleware';
import { initializeSocket } from './config/socket';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// ✅ CORS Configuration with credentials enabled for httpOnly cookies
const allowedOrigins: string[] = [
    'http://localhost:3000',  // Local frontend (old port)
    'http://localhost:5173',  // Local frontend (Vite)
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true, // ✅ Required for httpOnly cookie transmission
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.options('*', cors());

// ✅ Helmet security headers
app.use(
    helmet({
        crossOriginResourcePolicy: false, // Allow cross-origin images
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    })
);

// ✅ Body parsing middleware (before CSRF validation)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Cookie parsing middleware (before CSRF validation)
app.use(cookieParser());

// ✅ HTTP request logging
app.use(morgan('combined', { stream: httpLogStream as any }));

// ✅ CSRF Protection Middleware
// Applied globally to validate origins on all requests
app.use(csrfMiddleware.validateOrigin);
app.use(csrfMiddleware.validateRequestMethod);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', routes);

// Error handling middleware (should be last)
app.use(errorMiddleware.errorHandler);

// Use explicit PORT from environment with fallback for local dev
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

const start = async () => {
  try {
    await connectDatabase();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Socket.IO initialized`);
    });

    const shutdown = async () => {
      logger.info('Shutting down server');
      httpServer.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

start();

export { io };
export default app;
