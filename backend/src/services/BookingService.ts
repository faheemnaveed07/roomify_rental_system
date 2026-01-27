import { Types } from 'mongoose';
import { Booking, IBooking, BookingStatus, BookingType } from '../models/Booking';
import { Property } from '../models/Property';
import { PropertyStatus, PropertyType } from '@shared/types/property.types';
import { PaginationQuery } from '@shared/types/api.types';
import { logger } from '../utils/logger';

interface BookingRequest {
    propertyId: string;
    tenantId: string;
    requestMessage: string;
    proposedMoveInDate: Date;
    proposedDuration: {
        value: number;
        unit: 'months' | 'years';
    };
    bedNumber?: number;
}

interface BookingListResult {
    bookings: IBooking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class BookingService {
    /**
     * Create a new booking request
     */
    async createBookingRequest(request: BookingRequest): Promise<IBooking> {
        const property = await Property.findById(request.propertyId);
        if (!property) {
            throw new Error('Property not found');
        }

        if (property.status !== PropertyStatus.ACTIVE) {
            throw new Error('Property is not available for booking');
        }

        if (!property.availability.isAvailable) {
            throw new Error('Property is not currently available');
        }

        // Check if tenant already has a pending booking for this property
        const existingBooking = await Booking.findOne({
            property: request.propertyId,
            tenant: request.tenantId,
            status: { $in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
        });

        if (existingBooking) {
            throw new Error('You already have an active booking request for this property');
        }

        // Determine booking type
        const bookingType =
            property.propertyType === PropertyType.SHARED_ROOM
                ? BookingType.SHARED_ROOM_BED
                : BookingType.FULL_PROPERTY;

        // Validate bed number for shared rooms
        if (bookingType === BookingType.SHARED_ROOM_BED) {
            if (!request.bedNumber) {
                throw new Error('Bed number is required for shared room bookings');
            }
            if (
                property.sharedRoomDetails &&
                request.bedNumber > property.sharedRoomDetails.totalBeds
            ) {
                throw new Error('Invalid bed number');
            }
        }

        // Calculate rent details
        const monthlyRent = property.rent.amount;
        const securityDeposit = property.rent.securityDeposit;
        const durationMonths =
            request.proposedDuration.unit === 'years'
                ? request.proposedDuration.value * 12
                : request.proposedDuration.value;
        const totalAmount = monthlyRent * durationMonths + securityDeposit;

        const booking = await Booking.create({
            property: new Types.ObjectId(request.propertyId),
            tenant: new Types.ObjectId(request.tenantId),
            landlord: property.owner,
            bookingType,
            status: BookingStatus.PENDING,
            requestMessage: request.requestMessage,
            proposedMoveInDate: request.proposedMoveInDate,
            proposedDuration: request.proposedDuration,
            rentDetails: {
                monthlyRent,
                securityDeposit,
                totalAmount,
                currency: property.rent.currency,
            },
            bedNumber: request.bedNumber,
            timeline: {
                requestedAt: new Date(),
            },
        });

        // Increment property inquiries
        await Property.findByIdAndUpdate(request.propertyId, {
            $inc: { inquiries: 1 },
        });

        logger.info(`Booking request created: ${booking._id}`);
        return booking;
    }

    /**
     * Approve a booking request (landlord)
     */
    async approveBooking(
        bookingId: string,
        landlordId: string,
        responseMessage?: string
    ): Promise<IBooking> {
        const booking = await Booking.findOne({
            _id: bookingId,
            landlord: landlordId,
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        // If already approved, return gracefully (idempotency)
        if (booking.status === BookingStatus.APPROVED) {
            return booking;
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new Error(`Booking cannot be approved as it is currently ${booking.status}`);
        }

        booking.status = BookingStatus.APPROVED;
        booking.responseMessage = responseMessage;
        booking.timeline.respondedAt = new Date();
        booking.timeline.approvedAt = new Date();
        await booking.save();

        // Update property availability for full house
        if (booking.bookingType === BookingType.FULL_PROPERTY) {
            await Property.findByIdAndUpdate(booking.property, {
                'availability.isAvailable': false,
                status: PropertyStatus.RENTED,
            });
        } else {
            // Update shared room occupancy
            await Property.findByIdAndUpdate(booking.property, {
                $inc: {
                    'sharedRoomDetails.currentOccupants': 1,
                    'sharedRoomDetails.availableBeds': -1,
                },
            });

            // Check if all beds are now occupied
            const property = await Property.findById(booking.property);
            if (
                property?.sharedRoomDetails &&
                property.sharedRoomDetails.availableBeds <= 0
            ) {
                await Property.findByIdAndUpdate(booking.property, {
                    'availability.isAvailable': false,
                });
            }
        }

        // Reject other pending bookings for same property/bed
        await this.rejectConflictingBookings(booking);

        logger.info(`Booking approved: ${bookingId}`);
        return booking;
    }

    /**
     * Reject a booking request (landlord)
     */
    async rejectBooking(
        bookingId: string,
        landlordId: string,
        responseMessage: string
    ): Promise<IBooking> {
        const booking = await Booking.findOne({
            _id: bookingId,
            landlord: landlordId,
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        // If already rejected, return gracefully
        if (booking.status === BookingStatus.REJECTED) {
            return booking;
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new Error(`Booking cannot be rejected as it is currently ${booking.status}`);
        }

        booking.status = BookingStatus.REJECTED;
        booking.responseMessage = responseMessage;
        booking.timeline.respondedAt = new Date();
        booking.timeline.rejectedAt = new Date();
        await booking.save();

        logger.info(`Booking rejected: ${bookingId}`);
        return booking;
    }

    /**
     * Cancel a booking (tenant or landlord)
     */
    async cancelBooking(
        bookingId: string,
        userId: string,
        reason: string
    ): Promise<IBooking> {
        const booking = await Booking.findOne({
            _id: bookingId,
            $or: [{ tenant: userId }, { landlord: userId }],
            status: { $in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
        });

        if (!booking) {
            throw new Error('Booking not found or cannot be cancelled');
        }

        const wasApproved = booking.status === BookingStatus.APPROVED;

        booking.status = BookingStatus.CANCELLED;
        booking.cancellation = {
            cancelledBy: new Types.ObjectId(userId),
            reason,
            cancelledAt: new Date(),
        };
        booking.timeline.cancelledAt = new Date();
        await booking.save();

        // If booking was approved, restore property availability
        if (wasApproved) {
            if (booking.bookingType === BookingType.FULL_PROPERTY) {
                await Property.findByIdAndUpdate(booking.property, {
                    'availability.isAvailable': true,
                    status: PropertyStatus.ACTIVE,
                });
            } else {
                await Property.findByIdAndUpdate(booking.property, {
                    $inc: {
                        'sharedRoomDetails.currentOccupants': -1,
                        'sharedRoomDetails.availableBeds': 1,
                    },
                    'availability.isAvailable': true,
                });
            }
        }

        logger.info(`Booking cancelled: ${bookingId}`);
        return booking;
    }

    /**
     * Mark booking as completed
     */
    async completeBooking(bookingId: string, landlordId: string): Promise<IBooking> {
        const booking = await Booking.findOne({
            _id: bookingId,
            landlord: landlordId,
            status: BookingStatus.APPROVED,
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        booking.status = BookingStatus.COMPLETED;
        booking.timeline.completedAt = new Date();
        await booking.save();

        // Restore property availability
        if (booking.bookingType === BookingType.FULL_PROPERTY) {
            await Property.findByIdAndUpdate(booking.property, {
                'availability.isAvailable': true,
                status: PropertyStatus.ACTIVE,
            });
        } else {
            await Property.findByIdAndUpdate(booking.property, {
                $inc: {
                    'sharedRoomDetails.currentOccupants': -1,
                    'sharedRoomDetails.availableBeds': 1,
                },
                'availability.isAvailable': true,
            });
        }

        logger.info(`Booking completed: ${bookingId}`);
        return booking;
    }

    /**
     * Get booking by ID
     */
    async getById(bookingId: string): Promise<IBooking | null> {
        return Booking.findById(bookingId)
            .populate('property', 'title images location rent')
            .populate('tenant', 'firstName lastName email phone avatar')
            .populate('landlord', 'firstName lastName email phone avatar');
    }

    /**
     * Get bookings for tenant
     */
    async getTenantBookings(
        tenantId: string,
        pagination: PaginationQuery,
        status?: BookingStatus
    ): Promise<BookingListResult> {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const query: Record<string, unknown> = { tenant: tenantId };
        if (status) query.status = status;

        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate('property', 'title images location rent')
                .populate('landlord', 'firstName lastName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking.countDocuments(query),
        ]);

        return {
            bookings,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get bookings for landlord
     */
    async getLandlordBookings(
        landlordId: string,
        pagination: PaginationQuery,
        status?: BookingStatus
    ): Promise<BookingListResult> {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const query: Record<string, unknown> = { landlord: landlordId };
        if (status) query.status = status;

        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate('property', 'title images location')
                .populate('tenant', 'firstName lastName email phone avatar cnicVerified')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking.countDocuments(query),
        ]);

        return {
            bookings,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Add a note to booking
     */
    async addNote(
        bookingId: string,
        userId: string,
        content: string
    ): Promise<IBooking> {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        booking.notes.push({
            createdBy: new Types.ObjectId(userId),
            content,
            createdAt: new Date(),
        });
        await booking.save();

        return booking;
    }

    /**
     * Expire old pending bookings
     */
    async expirePendingBookings(): Promise<number> {
        const result = await Booking.updateMany(
            {
                status: BookingStatus.PENDING,
                expiresAt: { $lt: new Date() },
            },
            {
                $set: {
                    status: BookingStatus.EXPIRED,
                    'timeline.expiredAt': new Date(),
                },
            }
        );

        if (result.modifiedCount > 0) {
            logger.info(`Expired ${result.modifiedCount} pending bookings`);
        }

        return result.modifiedCount;
    }

    /**
     * Reject conflicting bookings after approval
     */
    private async rejectConflictingBookings(approvedBooking: IBooking): Promise<void> {
        const query: Record<string, unknown> = {
            _id: { $ne: approvedBooking._id },
            property: approvedBooking.property,
            status: BookingStatus.PENDING,
        };

        // For full property, reject all pending bookings
        // For shared room, reject only bookings for the same bed
        if (approvedBooking.bookingType === BookingType.SHARED_ROOM_BED) {
            query.bedNumber = approvedBooking.bedNumber;
        }

        await Booking.updateMany(query, {
            $set: {
                status: BookingStatus.REJECTED,
                responseMessage: 'This property/bed has been booked by another tenant',
                'timeline.rejectedAt': new Date(),
            },
        });
    }

    /**
     * Get booking statistics
     */
    async getStatistics(userId?: string, role?: 'tenant' | 'landlord'): Promise<Record<string, number>> {
        const match: Record<string, unknown> = {};
        if (userId && role) {
            match[role] = new Types.ObjectId(userId);
        }

        const stats = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const result: Record<string, number> = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
            completed: 0,
            expired: 0,
        };

        stats.forEach((stat) => {
            result[stat._id] = stat.count;
            result.total += stat.count;
        });

        return result;
    }
}

export const bookingService = new BookingService();

export default BookingService;
