import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { bookingService } from '../services/BookingService';
import { logger } from '../utils/logger';

const normalizeOwnerId = (owner: unknown): string | undefined => {
    if (!owner) {
        return undefined;
    }

    if (typeof owner === 'string') {
        return owner;
    }

    if (owner instanceof Types.ObjectId) {
        return owner.toString();
    }

    if (typeof owner === 'object') {
        const ownerRecord = owner as {
            _id?: unknown;
            id?: unknown;
            toString?: () => string;
        };

        if (ownerRecord._id) {
            return normalizeOwnerId(ownerRecord._id);
        }

        if (typeof ownerRecord.id === 'string' && ownerRecord.id) {
            return ownerRecord.id;
        }

        if (typeof ownerRecord.toString === 'function') {
            const value = ownerRecord.toString();
            if (value && value !== '[object Object]') {
                return value;
            }
        }
    }

    return undefined;
};

export class BookingController {
    /**
     * Create a new booking request
     */
    async requestBooking(req: Request, res: Response, _next: NextFunction) {
        try {
            const {
                propertyId,
                requestMessage,
                proposedMoveInDate,
                proposedDuration,
                bedNumber
            } = req.body;

            // Tenant ID comes from the authenticated user
            // ITokenPayload uses 'userId', not 'id'
            const tenantId = req.user?.userId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    message: 'User must be authenticated to make a booking'
                });
            }

            const booking = await bookingService.createBookingRequest({
                propertyId,
                tenantId,
                requestMessage,
                proposedMoveInDate: new Date(proposedMoveInDate),
                proposedDuration,
                bedNumber
            });

            return res.status(201).json({
                success: true,
                message: 'Booking request sent successfully',
                data: booking
            });
        } catch (error: any) {
            logger.error('Error creating booking request:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to send booking request'
            });
        }
    }

    /**
     * Get bookings for the current tenant
     */
    async getMyBookings(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user?.userId;
            const { page, limit, status } = req.query;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await bookingService.getTenantBookings(
                tenantId,
                {
                    page: Number(page) || 1,
                    limit: Number(limit) || 10
                },
                status as any
            );

            return res.json({
                success: true,
                data: result.bookings,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error: any) {
            return next(error);
        }
    }

    /**
     * Get booking details
     */
    async getBookingDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const booking = await bookingService.getById(id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Check if user is either the tenant or landlord
            const userId = req.user?.userId;
            const tenantId = normalizeOwnerId(booking.tenant);
            const landlordId = normalizeOwnerId(booking.landlord);

            if (!userId || (tenantId !== userId && landlordId !== userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            return res.json({
                success: true,
                data: booking
            });
        } catch (error: any) {
            return next(error);
        }
    }

    /**
     * Get bookings for the current landlord
     */
    async getLandlordBookings(req: Request, res: Response, next: NextFunction) {
        try {
            const landlordId = req.user?.userId;
            const { page, limit, status } = req.query;

            if (!landlordId || !Types.ObjectId.isValid(landlordId)) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required or invalid ID format'
                });
            }

            const landlordObjectId = new Types.ObjectId(landlordId);

            const result = await bookingService.getLandlordBookings(
                landlordObjectId.toString(),
                {
                    page: Number(page) || 1,
                    limit: Number(limit) || 10
                },
                status as any
            );

            return res.json({
                success: true,
                data: result.bookings,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error: any) {
            return next(error);
        }
    }

    /**
     * Approve a booking request
     */
    async approveBooking(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { responseMessage } = req.body;
            const landlordId = req.user?.userId;

            if (!landlordId || !Types.ObjectId.isValid(landlordId)) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required or invalid ID format'
                });
            }

            const landlordObjectId = new Types.ObjectId(landlordId);

            const booking = await bookingService.approveBooking(id, landlordObjectId.toString(), responseMessage);

            return res.json({
                success: true,
                message: 'Booking request approved',
                data: booking
            });
        } catch (error: any) {
            return next(error);
        }
    }

    /**
     * Reject a booking request
     */
    async rejectBooking(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { responseMessage } = req.body;
            const landlordId = req.user?.userId;

            if (!landlordId || !Types.ObjectId.isValid(landlordId)) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required or invalid ID format'
                });
            }

            const landlordObjectId = new Types.ObjectId(landlordId);

            const booking = await bookingService.rejectBooking(id, landlordObjectId.toString(), responseMessage);

            return res.json({
                success: true,
                message: 'Booking request rejected',
                data: booking
            });
        } catch (error: any) {
            return next(error);
        }
    }
}

export const bookingController = new BookingController();
export default bookingController;
