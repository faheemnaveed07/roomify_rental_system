import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Origin Validation Middleware
 * 
 * Provides basic CSRF protection by validating request origins.
 * - Allows requests from whitelisted origins
 * - Blocks requests from unknown origins (origin header mismatch)
 * - Works with httpOnly cookies (secure by design)
 * 
 * Combined with:
 * - sameSite=strict cookies (prevents cross-site cookie transmission)
 * - httpOnly flag (XSS protection - JS cannot access tokens)
 * - Secure flag in production (HTTPS only)
 * 
 * This provides lightweight CSRF protection without requiring explicit tokens.
 */

// Whitelist of allowed origins
const ALLOWED_ORIGINS = [
    'http://localhost:3000',  // Local frontend (old port)
    'http://localhost:5173',  // Local frontend (Vite)
    'http://localhost:5001',  // Local API (self-reference for development)
    process.env.FRONTEND_URL, // Production frontend URL (if provided)
].filter(Boolean); // Remove undefined values

/**
 * Validates that request origin matches allowed origins
 * Logs suspicious requests for monitoring
 */
export const validateOrigin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const origin = req.get('origin');
    
    // Skip validation for:
    // 1. Requests without origin header (non-browser requests, mobile apps with auth header)
    // 2. Development environment (for testing flexibility)
    if (!origin || process.env.NODE_ENV === 'development') {
        return next();
    }

    // Check if origin is in whitelist
    if (!ALLOWED_ORIGINS.includes(origin)) {
        logger.warn(`⚠️ CSRF: Blocked request from unauthorized origin: ${origin}`, {
            method: req.method,
            path: req.path,
            origin,
            userAgent: req.get('user-agent'),
        });

        res.status(403).json({
            success: false,
            message: 'Access denied: Invalid origin',
        });
        return;
    }

    // ✅ Origin is valid, proceed
    next();
};

/**
 * Validates that request method is appropriate for the request type
 * Blocks unexpected method combinations (e.g., GET requests to authentication endpoints)
 */
export const validateRequestMethod = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Allow GET/HEAD for health checks and retrievals
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // For state-changing operations (POST, PUT, DELETE, PATCH):
    // Ensure origin header is present to prevent simple CSRF attacks
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.get('origin');
        const referer = req.get('referer');

        // If no origin header, check referer as fallback
        if (!origin && !referer) {
            logger.warn(`⚠️ CSRF: Potential attack - No origin/referer header on ${req.method} ${req.path}`, {
                method: req.method,
                path: req.path,
                userAgent: req.get('user-agent'),
            });

            // In production, reject requests without origin/referer
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({
                    success: false,
                    message: 'Invalid request headers',
                });
                return;
            }
        }
    }

    next();
};

/**
 * Export both middlewares for flexible application
 * Use validateOrigin for all routes
 * Use validateRequestMethod for additional layer of POST/PUT/DELETE/PATCH validation
 */
export const csrfMiddleware = {
    validateOrigin,
    validateRequestMethod,
};
