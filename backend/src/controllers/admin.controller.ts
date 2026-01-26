import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/VerificationService';
import { propertyService } from '../services/PropertyService';
import { PropertyStatus } from '@shared/types/property.types';
import { paginationSchema } from '../utils/validators';
import { ApiResponse } from '@shared/types/api.types';

export class AdminController {
    // Document Verification
    async getPendingDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const documents = await verificationService.getPendingDocuments(limit);

            const response: ApiResponse = {
                success: true,
                message: 'Pending documents retrieved successfully',
                data: documents,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async approveDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user?.userId;
            const { id } = req.params;
            const { notes } = req.body;

            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const result = await verificationService.approveDocument(id, adminId, notes);

            const response: ApiResponse = {
                success: true,
                message: result.message,
                data: result,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async rejectDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user?.userId;
            const { id } = req.params;
            const { reason } = req.body;

            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            if (!reason) {
                res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required',
                });
                return;
            }

            const result = await verificationService.rejectDocument(id, adminId, reason);

            const response: ApiResponse = {
                success: true,
                message: result.message,
                data: result,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    // Property Verification
    async getPendingProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pagination = paginationSchema.parse(req.query);
            const { Property } = await import('../models/Property');

            const [properties, total] = await Promise.all([
                Property.find({ status: PropertyStatus.PENDING_VERIFICATION })
                    .populate('owner', 'firstName lastName email phone cnicVerified')
                    .sort({ createdAt: 1 })
                    .skip((pagination.page - 1) * pagination.limit)
                    .limit(pagination.limit),
                Property.countDocuments({ status: PropertyStatus.PENDING_VERIFICATION }),
            ]);

            const response: ApiResponse = {
                success: true,
                message: 'Pending properties retrieved successfully',
                data: properties,
                meta: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages: Math.ceil(total / pagination.limit),
                    hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
                    hasPrevPage: pagination.page > 1,
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async approveProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user?.userId;
            const { id } = req.params;

            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const property = await propertyService.updateStatus(id, PropertyStatus.ACTIVE, adminId);

            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Property approved successfully',
                data: property,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async rejectProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            if (!reason) {
                res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required',
                });
                return;
            }

            const property = await propertyService.updateStatus(id, PropertyStatus.REJECTED);

            if (!property) {
                res.status(404).json({
                    success: false,
                    message: 'Property not found',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Property rejected',
                data: property,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    // User Management
    async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pagination = paginationSchema.parse(req.query);
            const { role, status } = req.query;
            const { User } = await import('../models/User');

            const query: Record<string, unknown> = {};
            if (role) query.role = role;
            if (status) query.status = status;

            const [users, total] = await Promise.all([
                User.find(query)
                    .sort({ createdAt: -1 })
                    .skip((pagination.page - 1) * pagination.limit)
                    .limit(pagination.limit),
                User.countDocuments(query),
            ]);

            const response: ApiResponse = {
                success: true,
                message: 'Users retrieved successfully',
                data: users,
                meta: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages: Math.ceil(total / pagination.limit),
                    hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
                    hasPrevPage: pagination.page > 1,
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const { User } = await import('../models/User');

            const user = await User.findByIdAndUpdate(id, { status }, { new: true });

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'User status updated successfully',
                data: user,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    // Statistics
    async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { User } = await import('../models/User');
            const { Property } = await import('../models/Property');
            const { Booking } = await import('../models/Booking');

            const [
                totalUsers,
                totalProperties,
                activeListings,
                pendingVerifications,
                totalBookings,
                documentStats,
            ] = await Promise.all([
                User.countDocuments(),
                Property.countDocuments(),
                Property.countDocuments({ status: PropertyStatus.ACTIVE }),
                Property.countDocuments({ status: PropertyStatus.PENDING_VERIFICATION }),
                Booking.countDocuments(),
                verificationService.getStatistics(),
            ]);

            const response: ApiResponse = {
                success: true,
                message: 'Dashboard statistics retrieved successfully',
                data: {
                    users: {
                        total: totalUsers,
                    },
                    properties: {
                        total: totalProperties,
                        active: activeListings,
                        pending: pendingVerifications,
                    },
                    bookings: {
                        total: totalBookings,
                    },
                    documents: documentStats,
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();

export default adminController;
