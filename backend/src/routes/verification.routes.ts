import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { imageUpload } from '../middleware/upload.middleware';

const router = Router();

// All verification routes are for the logged-in user acting on their own account.
router.use(authenticate);

/** Current verification state + milestone progress */
router.get('/status', verificationController.getStatus.bind(verificationController));

/** Confirm email (demo simulation — see controller note) */
router.post('/email/confirm', verificationController.confirmEmail.bind(verificationController));

/** Submit CNIC front + back images */
router.post(
    '/cnic',
    imageUpload.fields([
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
    ]),
    verificationController.uploadCnic.bind(verificationController)
);

export default router;
