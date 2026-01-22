import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/user.types';

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

export const requireVerifiedUser = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // This would typically check if the user's email/CNIC is verified
    // For now, we just check if they're authenticated
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    // Additional verification checks could be added here
    next();
};

export default { requireRole, requireAdmin, requireLandlord, requireTenant, requireVerifiedUser };
