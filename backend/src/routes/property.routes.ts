import { Router } from 'express';
import { propertyController } from '../controllers/property.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { requireLandlord } from '../middleware/role.middleware';

const router = Router();

// Public routes
router.get('/search', propertyController.search.bind(propertyController));
router.get('/featured', propertyController.getFeatured.bind(propertyController));
router.get('/nearby', propertyController.getNearby.bind(propertyController));
router.get('/:id', optionalAuth, propertyController.getById.bind(propertyController));

// Protected routes (landlord only)
router.post('/', authenticate, requireLandlord, propertyController.create.bind(propertyController));
router.get('/my/listings', authenticate, requireLandlord, propertyController.getMyProperties.bind(propertyController));
router.put('/:id', authenticate, requireLandlord, propertyController.update.bind(propertyController));
router.delete('/:id', authenticate, requireLandlord, propertyController.delete.bind(propertyController));

export default router;
