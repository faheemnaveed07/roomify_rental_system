import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { ITokenPayload, UserStatus } from '@shared/types/user.types';
import { User } from '../models/User';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: ITokenPayload;
        }
    }
}

/**
 * Authenticate the caller.
 *
 * A signed JWT alone is not enough: the account it names may since have been
 * deleted, suspended, or had its role changed, and the token would happily keep
 * working until it expired. (Deleting users left stale sessions that still
 * passed role checks and then failed further down in confusing ways.) So the
 * token is verified for authenticity, then the account is re-read from the
 * database and THAT is the source of truth for role and status.
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        let decoded: ITokenPayload;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
        } catch {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
            return;
        }

        const account = await User.findById(decoded.userId).select('email role status');

        if (!account) {
            // Token is validly signed but the account is gone.
            res.status(401).json({
                success: false,
                message: 'Your session is no longer valid. Please sign in again.',
                error: { code: 'SESSION_INVALID', message: 'Account no longer exists' },
            });
            return;
        }

        if (account.status === UserStatus.SUSPENDED || account.status === UserStatus.DEACTIVATED) {
            res.status(403).json({
                success: false,
                message: `Your account is ${account.status}.`,
                error: { code: 'ACCOUNT_INACTIVE', message: `Account is ${account.status}` },
            });
            return;
        }

        // Use the CURRENT role/email, not whatever the token was minted with.
        req.user = {
            userId: decoded.userId,
            email: account.email,
            role: account.role,
        } as ITokenPayload;

        next();
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
