import { Router } from 'express';
import { roommateProfileController } from '../controllers/roommateProfile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/role.middleware';

const router = Router();

// All roommate-profile routes require authentication + tenant role
router.use(authenticate, requireTenant);

router.get('/', roommateProfileController.getProfile.bind(roommateProfileController));
router.post('/', roommateProfileController.createProfile.bind(roommateProfileController));
router.put('/', roommateProfileController.updateProfile.bind(roommateProfileController));

export default router;
