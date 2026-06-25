import { Router, RequestHandler } from 'express';
import {
    generateAgreement,
    getAgreementByBooking,
    getLandlordAgreements,
    downloadAgreement,
    signAgreement,
} from '../controllers/agreement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { UserRole } from '@shared/types/user.types';

const router = Router();

// All agreement routes require authentication
router.use(authenticate as RequestHandler);

// Generate agreement for a booking (tenant or landlord)
router.post('/generate/:bookingId', generateAgreement as RequestHandler);

// List the landlord's own agreements (powers the "awaiting your signature" section)
router.get('/landlord/mine', requireRole(UserRole.LANDLORD) as RequestHandler, getLandlordAgreements as RequestHandler);

// Get agreement metadata for a booking
router.get('/booking/:bookingId', getAgreementByBooking as RequestHandler);

// Download PDF (streams file)
router.get('/download/:id', downloadAgreement as RequestHandler);

// Mark agreement as signed
router.put('/:id/sign', signAgreement as RequestHandler);

export default router;
