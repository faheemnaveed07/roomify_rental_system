import { Router } from 'express';
import { landlordController } from '../controllers/landlord.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All landlord routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/landlord/stats
 * @desc    Get landlord dashboard statistics
 * @access  Private (Landlord)
 */
router.get('/stats', landlordController.getDashboardStats);

/**
 * @route   GET /api/landlord/properties
 * @desc    Get all properties owned by the landlord
 * @access  Private (Landlord)
 */
router.get('/properties', landlordController.getMyProperties);

export default router;
