import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { ITokenPayload } from '@shared/types/user.types';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: ITokenPayload;
        }
    }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // ✅ Try to read from httpOnly cookie first
        let token = req.cookies.accessToken;

        // Fallback to Authorization header for mobile/API clients
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
            });
            return;
        }

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
    } catch (error) {
        next(error);
    }
};

export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        // ✅ Try to read from httpOnly cookie first
        let token = req.cookies.accessToken;

        // Fallback to Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
                req.user = decoded;
            } catch {
                // Token is invalid, but we continue without user context
            }
        }
        next();
    } catch (error) {
        next(error);
    }
};

export default { authenticate, optionalAuth };
