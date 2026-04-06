import { Router } from 'express';
import { matchingController } from '../controllers/matching.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All matching routes require authentication
router.get('/properties', authenticate, matchingController.getMatchedProperties.bind(matchingController));
router.get('/property/:propertyId', authenticate, matchingController.getPropertyScore.bind(matchingController));

export default router;
