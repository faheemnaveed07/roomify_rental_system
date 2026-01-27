import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Property } from '../models/Property';
import { Booking, BookingStatus } from '../models/Booking';
import { logger } from '../utils/logger';
import { LandlordStatistics } from '@shared/types';

export class LandlordController {
    /**
     * Get statistics for the landlord dashboard
     */
    async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const landlordId = req.user?.userId;
            console.log('Incoming Landlord ID:', landlordId);

            if (!landlordId || !Types.ObjectId.isValid(landlordId)) {
                console.error('Invalid ID format detected:', landlordId);
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required or invalid ID format'
                });
            }

            const landlordObjectId = new Types.ObjectId(landlordId);

            // 1. Total Properties
            const totalProperties = await Property.countDocuments({ owner: landlordObjectId });

            // 2. Pending Requests
            const pendingRequests = await Booking.countDocuments({
                landlord: landlordObjectId,
                status: BookingStatus.PENDING
            });

            // 3. Confirmed Bookings (Approved)
            const confirmedBookings = await Booking.countDocuments({
                landlord: landlordObjectId,
                status: BookingStatus.APPROVED
            });

            // 4. Total Revenue (Sum of totalAmount for COMPLETED or APPROVED bookings)
            const revenueResult = await Booking.aggregate([
                {
                    $match: {
                        landlord: landlordObjectId,
                        status: { $in: [BookingStatus.APPROVED, BookingStatus.COMPLETED] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$rentDetails.totalAmount' }
                    }
                }
            ]);

            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

            const stats: LandlordStatistics = {
                totalProperties,
                pendingRequests,
                confirmedBookings,
                totalRevenue,
                currency: 'PKR' // Default currency for now
            };

            return res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            logger.error('Error fetching landlord stats:', error);
            return next(error);
        }
    }

    /**
     * Get properties owned by the landlord
     */
    async getMyProperties(req: Request, res: Response, next: NextFunction) {
        try {
            const landlordId = req.user?.userId;

            if (!landlordId || !Types.ObjectId.isValid(landlordId)) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required or invalid ID format'
                });
            }

            const landlordObjectId = new Types.ObjectId(landlordId);

            const properties = await Property.find({ owner: landlordObjectId }).sort({ createdAt: -1 });

            return res.json({
                success: true,
                data: properties
            });
        } catch (error: any) {
            return next(error);
        }
    }
}

export const landlordController = new LandlordController();
export default landlordController;
