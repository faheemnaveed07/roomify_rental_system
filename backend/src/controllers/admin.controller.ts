import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/VerificationService';
import { propertyService } from '../services/PropertyService';
import { PropertyStatus } from '@shared/types/property.types';
import { paginationSchema } from '../utils/validators';
import { ApiResponse, AdminAnalyticsData } from '@shared/types/api.types';
import PaymentService from '../services/PaymentService';
import { PaymentStatus } from '../models/Payment';

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
    async getAllProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pagination = paginationSchema.parse(req.query);
            const { status, city, search } = req.query;
            const { Property } = await import('../models/Property');

            const query: Record<string, unknown> = {};
            if (status) query.status = status;
            if (city) query['location.city'] = new RegExp(String(city).trim(), 'i');
            if (search) {
                const regex = new RegExp(String(search).trim(), 'i');
                query.$or = [
                    { title: regex },
                    { 'location.city': regex },
                    { 'location.area': regex },
                ];
            }

            const [properties, total] = await Promise.all([
                Property.find(query)
                    .populate('owner', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .skip((pagination.page - 1) * pagination.limit)
                    .limit(pagination.limit),
                Property.countDocuments(query),
            ]);

            const response: ApiResponse = {
                success: true,
                message: 'Properties retrieved successfully',
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
            const { role, status, search } = req.query;
            const { User } = await import('../models/User');

            const query: Record<string, unknown> = {};
            if (role) query.role = role;
            if (status) query.status = status;
            if (search) {
                const regex = new RegExp(String(search).trim(), 'i');
                query.$or = [
                    { firstName: regex },
                    { lastName: regex },
                    { email: regex },
                ];
            }

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

            const allowedStatuses = ['active', 'suspended', 'deactivated', 'pending'];
            if (!allowedStatuses.includes(status)) {
                res.status(400).json({ success: false, message: 'Invalid status value' });
                return;
            }

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

    async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const adminId = req.user?.userId;
            const { User } = await import('../models/User');

            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const allowedRoles = ['tenant', 'landlord', 'admin'];
            if (!allowedRoles.includes(role)) {
                res.status(400).json({ success: false, message: 'Invalid role value' });
                return;
            }

            // Prevent admin from changing their own role
            if (id === adminId) {
                res.status(400).json({ success: false, message: 'Cannot change your own role' });
                return;
            }

            const user = await User.findByIdAndUpdate(id, { role }, { new: true });

            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'User role updated successfully',
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

    // ─── Analytics ────────────────────────────────────────────────────────
    async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { User } = await import('../models/User');
            const { Property } = await import('../models/Property');
            const { Booking } = await import('../models/Booking');
            const { Payment } = await import('../models/Payment');

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const [
                totalUsers,
                totalProperties,
                totalBookings,
                revenueAgg,
                usersByRole,
                propertiesByStatus,
                bookingsByStatus,
                revenueByMonth,
                newUsersThisMonth,
                newPropertiesThisMonth,
                newBookingsThisMonth,
            ] = await Promise.all([
                User.countDocuments(),
                Property.countDocuments(),
                Booking.countDocuments(),
                Payment.aggregate([
                    { $match: { status: PaymentStatus.CONFIRMED } },
                    { $group: { _id: null, total: { $sum: '$amount' } } },
                ]),
                User.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } },
                ]),
                Property.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]),
                Booking.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]),
                Payment.aggregate([
                    { $match: { status: PaymentStatus.CONFIRMED } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' },
                            },
                            revenue: { $sum: '$amount' },
                        },
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } },
                    { $limit: 12 },
                ]),
                User.countDocuments({ createdAt: { $gte: startOfMonth } }),
                Property.countDocuments({ createdAt: { $gte: startOfMonth } }),
                Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
            ]);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const data: AdminAnalyticsData = {
                overview: {
                    totalUsers,
                    totalProperties,
                    totalBookings,
                    totalRevenue: revenueAgg[0]?.total ?? 0,
                    currency: 'PKR',
                },
                usersByRole: usersByRole.map((r: { _id: string; count: number }) => ({
                    role: r._id,
                    count: r.count,
                })),
                propertiesByStatus: propertiesByStatus.map((p: { _id: string; count: number }) => ({
                    status: p._id,
                    count: p.count,
                })),
                bookingsByStatus: bookingsByStatus.map((b: { _id: string; count: number }) => ({
                    status: b._id,
                    count: b.count,
                })),
                revenueByMonth: revenueByMonth.map((r: { _id: { year: number; month: number }; revenue: number }) => ({
                    month: `${monthNames[r._id.month - 1]} ${r._id.year}`,
                    revenue: r.revenue,
                })),
                recentActivity: {
                    newUsersThisMonth,
                    newPropertiesThisMonth,
                    newBookingsThisMonth,
                },
            };

            const response: ApiResponse<AdminAnalyticsData> = {
                success: true,
                message: 'Analytics data retrieved successfully',
                data,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    // ─── Payment Management ───────────────────────────────────────────────
    async getAllPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const status = req.query.status as PaymentStatus | undefined;

            const result = await PaymentService.adminGetAllPayments(page, limit, status);

            const response: ApiResponse = {
                success: true,
                message: 'Payments retrieved successfully',
                data: result.payments,
                meta: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasNextPage: result.page < result.totalPages,
                    hasPrevPage: result.page > 1,
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async approvePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user?.userId;
            const { id } = req.params;
            const { adminNotes } = req.body;

            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const payment = await PaymentService.adminApprovePayment(id, adminId, adminNotes);

            const response: ApiResponse = {
                success: true,
                message: 'Payment approved and booking confirmed',
                data: payment,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async rejectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.user?.userId;
            const { id } = req.params;
            const { reason } = req.body;

            if (!adminId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            if (!reason || reason.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required',
                });
                return;
            }

            const payment = await PaymentService.adminRejectPayment(id, adminId, reason.trim());

            const response: ApiResponse = {
                success: true,
                message: 'Payment rejected',
                data: payment,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();

export default adminController;
