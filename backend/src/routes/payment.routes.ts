import { Router, RequestHandler } from 'express';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { UserRole } from '@shared/types/user.types';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Bank Account routes (landlord only)
router.get('/bank-accounts', requireRole(UserRole.LANDLORD), paymentController.getBankAccounts as RequestHandler);
router.post('/bank-accounts', requireRole(UserRole.LANDLORD), paymentController.addBankAccount as RequestHandler);
router.put('/bank-accounts/:accountId', requireRole(UserRole.LANDLORD), paymentController.updateBankAccount as RequestHandler);
router.delete('/bank-accounts/:accountId', requireRole(UserRole.LANDLORD), paymentController.deleteBankAccount as RequestHandler);

// Landlord payment stats
router.get('/landlord/stats', requireRole(UserRole.LANDLORD), paymentController.getLandlordPaymentStats as RequestHandler);

// Landlord payments list
router.get('/landlord', requireRole(UserRole.LANDLORD), paymentController.getLandlordPayments as RequestHandler);

// Tenant payments
router.get('/tenant', requireRole(UserRole.TENANT), paymentController.getTenantPayments as RequestHandler);

// Create payment (tenant)
router.post('/', requireRole(UserRole.TENANT), paymentController.createPayment as RequestHandler);

// Submit payment proof (tenant - for bank transfer)
router.post('/:paymentId/proof', requireRole(UserRole.TENANT), paymentController.submitPaymentProof as RequestHandler);

// Schedule cash collection (tenant)
router.post('/:paymentId/schedule-cash', requireRole(UserRole.TENANT), paymentController.scheduleCashCollection as RequestHandler);

// Confirm/reject payment (landlord)
router.post('/:paymentId/confirm', requireRole(UserRole.LANDLORD), paymentController.confirmPayment as RequestHandler);

// Get single payment (both tenant and landlord)
router.get('/:paymentId', paymentController.getPaymentById as RequestHandler);

// Get payments for a booking
router.get('/booking/:bookingId', paymentController.getBookingPayments as RequestHandler);

export default router;
