import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/bookings/request
 * @desc    Create a new booking request
 * @access  Private
 */
router.post('/request', bookingController.requestBooking);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get current user's booking requests (as tenant)
 * @access  Private
 */
router.get('/my-bookings', bookingController.getMyBookings);

/**
 * @route   GET /api/bookings/landlord
 * @desc    Get bookings for current landlord
 * @access  Private
 */
router.get('/landlord', bookingController.getLandlordBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details
 * @access  Private
 */
router.get('/:id', bookingController.getBookingDetails);

/**
 * @route   POST /api/bookings/:id/approve
 * @desc    Approve a booking request
 * @access  Private
 */
router.post('/:id/approve', bookingController.approveBooking);

/**
 * @route   POST /api/bookings/:id/reject
 * @desc    Reject a booking request
 * @access  Private
 */
router.post('/:id/reject', bookingController.rejectBooking);

export default router;
