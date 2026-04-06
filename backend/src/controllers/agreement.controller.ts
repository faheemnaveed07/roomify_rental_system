import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import AgreementService from '../services/AgreementService';
import { UserRole } from '@shared/types/user.types';

/**
 * POST /agreements/generate/:bookingId
 * Generate PDF agreement for a completed booking.
 */
export const generateAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { bookingId } = req.params;
        const agreement = await AgreementService.generateAgreement(bookingId, userId);

        res.status(201).json({
            success: true,
            data: agreement,
        });
    } catch (error: any) {
        if (
            error.message === 'Unauthorized: You are not a party to this booking' ||
            error.message === 'Unauthorized'
        ) {
            res.status(403).json({ success: false, message: error.message });
            return;
        }
        if (
            error.message === 'Agreement can only be generated for completed bookings' ||
            error.message === 'An agreement has already been generated for this booking'
        ) {
            res.status(400).json({ success: false, message: error.message });
            return;
        }
        if (error.message === 'Booking not found') {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};

/**
 * GET /agreements/booking/:bookingId
 * Retrieve agreement metadata for a booking.
 */
export const getAgreementByBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === UserRole.ADMIN;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { bookingId } = req.params;
        const agreement = await AgreementService.getAgreementByBooking(bookingId, userId, isAdmin);

        if (!agreement) {
            res.status(404).json({ success: false, message: 'No agreement found for this booking' });
            return;
        }

        res.status(200).json({ success: true, data: agreement });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            res.status(403).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};

/**
 * GET /agreements/download/:id
 * Stream the PDF file for download.
 */
export const downloadAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === UserRole.ADMIN;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const agreement = await AgreementService.getAgreementById(id, userId, isAdmin);

        if (!agreement) {
            res.status(404).json({ success: false, message: 'Agreement not found' });
            return;
        }

        if (!fs.existsSync(agreement.pdfPath)) {
            res.status(404).json({ success: false, message: 'Agreement PDF file not found on server' });
            return;
        }

        const filename = `lease-agreement-${agreement.booking.toString()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        fs.createReadStream(agreement.pdfPath).pipe(res);
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            res.status(403).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};

/**
 * PUT /agreements/:id/sign
 * Mark the agreement as signed by the requesting party.
 */
export const signAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const agreement = await AgreementService.markAsSigned(id, userId);

        res.status(200).json({ success: true, data: agreement });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            res.status(403).json({ success: false, message: error.message });
            return;
        }
        if (error.message === 'Agreement not found') {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
};
