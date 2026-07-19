import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/VerificationService';
import { DocumentModel, DocumentType } from '../models/Document';
import { User } from '../models/User';
import { ApiResponse } from '@shared/types/api.types';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

type MulterFiles = Record<string, Express.Multer.File[]> | undefined;

/**
 * User-facing verification endpoints.
 *
 * The admin side (review / approve / reject) already existed in
 * VerificationService + admin routes; what was missing was any way for a user to
 * actually submit their documents. This adds that.
 */
export class VerificationController {
    /** Current verification state + milestone progress for the logged-in user. */
    async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const user = await User.findById(userId).select('emailVerified cnicVerified cnicNumber');
            if (!user) throw new AppError('Account not found', 404, 'NOT_FOUND');

            const cnicDocs = await DocumentModel.find({
                user: userId,
                documentType: { $in: [DocumentType.CNIC_FRONT, DocumentType.CNIC_BACK] },
            }).select('documentType status url createdAt');

            const front = cnicDocs.find((d) => d.documentType === DocumentType.CNIC_FRONT);
            const back = cnicDocs.find((d) => d.documentType === DocumentType.CNIC_BACK);

            const milestones = [
                { key: 'account', label: 'Account created', done: true },
                { key: 'email', label: 'Email verified', done: !!user.emailVerified },
                { key: 'cnic_upload', label: 'CNIC uploaded', done: !!front && !!back },
                { key: 'verified', label: 'Identity verified', done: !!user.cnicVerified },
            ];
            const completed = milestones.filter((m) => m.done).length;

            const response: ApiResponse = {
                success: true,
                message: 'Verification status retrieved successfully',
                data: {
                    emailVerified: !!user.emailVerified,
                    cnicVerified: !!user.cnicVerified,
                    cnicNumber: user.cnicNumber ?? null,
                    fullyVerified: !!user.emailVerified && !!user.cnicVerified,
                    cnic: {
                        front: front ? { url: front.url, status: front.status } : null,
                        back: back ? { url: back.url, status: back.status } : null,
                    },
                    milestones,
                    progress: Math.round((completed / milestones.length) * 100),
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Confirm the user's email.
     *
     * DEMO SIMULATION — this project has no third-party email-verification
     * provider wired up, so this endpoint simply marks the address confirmed.
     * It performs NO real round-trip and proves nothing about the mailbox.
     * Swap this for the token flow in AuthService.verifyEmail (which is real and
     * already implemented) before this is ever used for anything that matters.
     */
    async confirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const user = await User.findById(userId);
            if (!user) throw new AppError('Account not found', 404, 'NOT_FOUND');

            user.emailVerified = true;
            await user.save({ validateModifiedOnly: true });
            logger.info(`[demo] Email marked verified for ${user.email}`);

            const response: ApiResponse = {
                success: true,
                message: 'Email verified successfully',
                data: { emailVerified: true },
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit CNIC front + back images.
     *
     * Documents are stored as PENDING so they still appear in the admin review
     * queue, while the user is marked verified immediately so the demo flow
     * doesn't stall waiting on an admin.
     */
    async uploadCnic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const files = req.files as MulterFiles;
            const frontFile = files?.front?.[0];
            const backFile = files?.back?.[0];

            if (!frontFile || !backFile) {
                throw new AppError(
                    'Both CNIC front and back images are required',
                    400,
                    'CNIC_IMAGES_REQUIRED'
                );
            }

            // Replace any previous submission so re-uploads don't stack up.
            await DocumentModel.deleteMany({
                user: userId,
                documentType: { $in: [DocumentType.CNIC_FRONT, DocumentType.CNIC_BACK] },
            });

            await verificationService.uploadDocument(userId, frontFile, DocumentType.CNIC_FRONT);
            await verificationService.uploadDocument(userId, backFile, DocumentType.CNIC_BACK);

            const cnicNumber = typeof req.body?.cnicNumber === 'string' ? req.body.cnicNumber.trim() : '';

            const user = await User.findById(userId);
            if (!user) throw new AppError('Account not found', 404, 'NOT_FOUND');

            if (cnicNumber) user.cnicNumber = cnicNumber;
            user.cnicVerified = true;
            await user.save({ validateModifiedOnly: true });

            logger.info(`[demo] CNIC marked verified for ${user.email}`);

            const response: ApiResponse = {
                success: true,
                message: 'CNIC submitted and verified successfully',
                data: { cnicVerified: true },
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const verificationController = new VerificationController();
export default verificationController;
