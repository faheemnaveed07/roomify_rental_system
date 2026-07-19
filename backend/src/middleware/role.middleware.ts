import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/types/user.types';
import { User } from '../models/User';

export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role as UserRole)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
            return;
        }

        next();
    };
};

export const requireAdmin = requireRole(UserRole.ADMIN);

export const requireLandlord = requireRole(UserRole.LANDLORD, UserRole.ADMIN);

export const requireTenant = requireRole(UserRole.TENANT, UserRole.ADMIN);

/**
 * Blocks trust-critical actions (listing a property, requesting a booking)
 * until the account has completed both email and CNIC verification.
 * Admins bypass the check.
 *
 * Responds 403 with code VERIFICATION_REQUIRED plus which steps are missing, so
 * the frontend can route the user straight to the right verification step.
 */
export const requireVerifiedUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (req.user.role === UserRole.ADMIN) {
        next();
        return;
    }

    try {
        const user = await User.findById(req.user.userId).select('emailVerified cnicVerified');
        if (!user) {
            res.status(401).json({ success: false, message: 'Account not found' });
            return;
        }

        if (!user.emailVerified || !user.cnicVerified) {
            res.status(403).json({
                success: false,
                message: 'Please complete verification before performing this action',
                error: {
                    code: 'VERIFICATION_REQUIRED',
                    message: 'Email and CNIC verification are required',
                    details: {
                        emailVerified: user.emailVerified,
                        cnicVerified: user.cnicVerified,
                    },
                },
            });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default { requireRole, requireAdmin, requireLandlord, requireTenant, requireVerifiedUser };
