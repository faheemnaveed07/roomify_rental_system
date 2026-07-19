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
import { connectDatabaseWithRetry } from './config/database';
import { logger, httpLogStream } from './utils/logger';
import errorMiddleware from './middleware/error.middleware';
import { csrfMiddleware } from './middleware/csrf.middleware';
import { initializeSocket } from './config/socket';
import { isAllowedOrigin } from './utils/origins';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// ✅ CORS Configuration with credentials enabled for httpOnly cookies.
// Origin is validated via the shared allow-list (normalizes trailing slashes
// and accepts every Vercel preview/production URL of this project).
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        callback(null, isAllowedOrigin(origin));
    },
    credentials: true, // ✅ Required for httpOnly cookie transmission
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Helmet security headers
app.use(
    helmet({
        crossOriginResourcePolicy: false, // Allow cross-origin images
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "http://localhost:5001"],
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

// Root — lightweight liveness so Hugging Face's edge/health-check and uptime
// pingers get a 200 on "/" (the App tab otherwise shows a 500 for an API-only
// Space). Real health/DB status lives at /api/health.
app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'Domavi API', health: '/api/health' });
});

app.use('/api', routes);

// Error handling middleware (should be last)
app.use(errorMiddleware.errorHandler);

// Use explicit PORT from environment with fallback for local dev
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

const start = async () => {
  // Start the HTTP server FIRST, independent of the database. This keeps
  // /api/health and CORS responding even while MongoDB is still connecting, so
  // a transient Atlas blip can never leave the container dead (a RUNTIME_ERROR
  // Space on Hugging Face is not auto-restarted, which previously turned a brief
  // DB hiccup into a multi-day outage that surfaced as a misleading CORS error).
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

  // Connect to MongoDB in the background with retry. DB-dependent routes return
  // a proper 5xx (with correct CORS headers) until the connection is ready;
  // mongoose auto-reconnects thereafter. We never process.exit on DB failure.
  connectDatabaseWithRetry().catch((error) => {
    logger.error('Unexpected error in database connection bootstrap', error as Error);
  });
};

start();

export { io };
export default app;
