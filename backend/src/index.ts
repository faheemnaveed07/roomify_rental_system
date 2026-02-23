import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import path from 'path';
import routes from './routes/index';
import { connectDatabase } from './config/database';
import { env } from './config/environment';
import { logger, httpLogStream } from './utils/logger';
import errorMiddleware from './middleware/error.middleware';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: httpLogStream as any }));


// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', routes);

// Error handling middleware (should be last)
// Is line ko change karein
app.use(errorMiddleware.errorHandler); // .errorHandler add karein

// Use explicit PORT from environment with fallback for local dev
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

const start = async () => {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down server');
      server.close(() => {
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

export default app;
