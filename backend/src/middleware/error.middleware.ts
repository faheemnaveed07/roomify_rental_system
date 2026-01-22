import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ApiResponse, ApiError } from '../types/api.types';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    errors?: Record<string, string[]>;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorDetails: ApiError = {
        code: err.code || 'INTERNAL_ERROR',
        message,
    };

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation failed';
        errorDetails = {
            code: 'VALIDATION_ERROR',
            message,
            details: err.errors.reduce(
                (acc, error) => {
                    const path = error.path.join('.');
                    if (!acc[path]) {
                        acc[path] = [];
                    }
                    acc[path].push(error.message);
                    return acc;
                },
                {} as Record<string, string[]>
            ),
        };
    }

    // Handle MongoDB duplicate key error
    if (err.code === '11000' || (err as Record<string, unknown>).code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry found';
        errorDetails = {
            code: 'DUPLICATE_ERROR',
            message,
        };
    }

    // Handle MongoDB validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errorDetails = {
            code: 'VALIDATION_ERROR',
            message,
            details: err.errors,
        };
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorDetails = {
            code: 'INVALID_TOKEN',
            message,
        };
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorDetails = {
            code: 'TOKEN_EXPIRED',
            message,
        };
    }

    // Handle CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        errorDetails = {
            code: 'INVALID_ID',
            message,
        };
    }

    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        userId: req.user?.userId,
    });

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorDetails.stack = err.stack;
    }

    const response: ApiResponse = {
        success: false,
        message,
        error: errorDetails,
    };

    res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    const response: ApiResponse = {
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
        },
    };

    res.status(404).json(response);
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default { errorHandler, notFoundHandler, asyncHandler };
