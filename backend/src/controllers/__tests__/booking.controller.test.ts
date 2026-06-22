import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { BookingController } from '../booking.controller';
import { bookingService } from '../../services/BookingService';

jest.mock('../../services/BookingService', () => ({
    bookingService: {
        getById: jest.fn(),
    },
}));

describe('BookingController.getBookingDetails authorization', () => {
    const controller = new BookingController();
    const mockedBookingService = bookingService as jest.Mocked<typeof bookingService>;

    const createRes = (): Response => {
        const res = {} as Response;
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    const next: NextFunction = jest.fn();

    it('allows tenant owner when tenant is a populated document', async () => {
        const tenantId = new Types.ObjectId().toString();
        const landlordId = new Types.ObjectId().toString();

        const booking = {
            tenant: {
                _id: tenantId,
                toString: () => '[object Object]',
            },
            landlord: {
                _id: landlordId,
                toString: () => '[object Object]',
            },
        } as any;

        mockedBookingService.getById.mockResolvedValue(booking);

        const req = {
            params: { id: new Types.ObjectId().toString() },
            user: { userId: tenantId },
        } as unknown as Request;
        const res = createRes();

        await controller.getBookingDetails(req, res, next);

        expect(res.status).not.toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: booking,
        });
    });

    it('allows landlord owner when tenant/landlord are non-populated ObjectId fields', async () => {
        const tenantId = new Types.ObjectId();
        const landlordId = new Types.ObjectId();

        const booking = {
            tenant: tenantId,
            landlord: landlordId,
        } as any;

        mockedBookingService.getById.mockResolvedValue(booking);

        const req = {
            params: { id: new Types.ObjectId().toString() },
            user: { userId: landlordId.toString() },
        } as unknown as Request;
        const res = createRes();

        await controller.getBookingDetails(req, res, next);

        expect(res.status).not.toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: booking,
        });
    });

    it('returns 403 for non-owner user', async () => {
        const booking = {
            tenant: {
                _id: new Types.ObjectId().toString(),
                toString: () => '[object Object]',
            },
            landlord: {
                _id: new Types.ObjectId().toString(),
                toString: () => '[object Object]',
            },
        } as any;

        mockedBookingService.getById.mockResolvedValue(booking);

        const req = {
            params: { id: new Types.ObjectId().toString() },
            user: { userId: new Types.ObjectId().toString() },
        } as unknown as Request;
        const res = createRes();

        await controller.getBookingDetails(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Access denied',
        });
    });
});
