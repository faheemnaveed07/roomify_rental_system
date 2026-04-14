import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Strategy:
 * 
 * Authentication endpoints (/login, /register, /forgot-password, /reset-password):
 * - 5 requests per 15 minutes per IP
 * 
 * Token refresh endpoint:
 * - 10 requests per 15 minutes per IP (slightly more lenient for legitimate users)
 * 
 * Email verification:
 * - 3 requests per 1 hour per IP (users rarely verify email multiple times)
 */

// Strict rate limiter for login/register
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req: Request): boolean => {
        // Skip rate limiting in development
        return process.env.NODE_ENV === 'development';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again in 15 minutes.',
        });
    },
});

// Moderate rate limiter for password reset/forgot password
export const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per windowMs
    message: 'Too many password reset attempts. Please try again after 1 hour.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request): boolean => {
        return process.env.NODE_ENV === 'development';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts. Please try again in 1 hour.',
        });
    },
});

// Lenient rate limiter for token refresh (for legitimate users)
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per windowMs
    message: 'Too many token refresh attempts.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request): boolean => {
        return process.env.NODE_ENV === 'development';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many refresh attempts. Please try again later.',
        });
    },
});

// Email verification limiter
export const emailVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: 'Too many verification attempts.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request): boolean => {
        return process.env.NODE_ENV === 'development';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many verification attempts. Please try again later.',
        });
    },
});
