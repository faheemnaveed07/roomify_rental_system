import winston, { format, transports, Logger } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logDirectory = path.join(process.cwd(), 'logs');

const createLogger = (): Logger => {
    return winston.createLogger({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            logFormat
        ),
        defaultMeta: { service: 'roomify-api' },
        transports: [
            // Console transport
            new transports.Console({
                format: combine(colorize(), logFormat),
            }),
            // Error log file
            new transports.File({
                filename: path.join(logDirectory, 'error.log'),
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }),
            // Combined log file
            new transports.File({
                filename: path.join(logDirectory, 'combined.log'),
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }),
        ],
        exceptionHandlers: [
            new transports.File({
                filename: path.join(logDirectory, 'exceptions.log'),
            }),
        ],
        rejectionHandlers: [
            new transports.File({
                filename: path.join(logDirectory, 'rejections.log'),
            }),
        ],
    });
};

export const logger = createLogger();

// Stream for Morgan HTTP logger
export const httpLogStream = {
    write: (message: string): void => {
        logger.http(message.trim());
    },
};

export default logger;
