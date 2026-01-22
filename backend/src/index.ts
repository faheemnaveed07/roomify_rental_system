import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index';
import { connectDatabase } from './config/database';
import { env } from './config/environment';
import { logger, httpLogStream } from './utils/logger';
import errorMiddleware from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: httpLogStream as any }));

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use('/api', routes);

// Error handling middleware (should be last)
// Is line ko change karein
app.use(errorMiddleware.errorHandler); // .errorHandler add karein

const start = async () => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
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
