import { Router, RequestHandler } from 'express';
import {
    generateAgreement,
    getAgreementByBooking,
    downloadAgreement,
    signAgreement,
} from '../controllers/agreement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All agreement routes require authentication
router.use(authenticate as RequestHandler);

// Generate agreement for a booking (tenant or landlord)
router.post('/generate/:bookingId', generateAgreement as RequestHandler);

// Get agreement metadata for a booking
router.get('/booking/:bookingId', getAgreementByBooking as RequestHandler);

// Download PDF (streams file)
router.get('/download/:id', downloadAgreement as RequestHandler);

// Mark agreement as signed
router.put('/:id/sign', signAgreement as RequestHandler);

export default router;
