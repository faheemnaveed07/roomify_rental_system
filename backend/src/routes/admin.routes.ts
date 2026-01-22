import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));

// Document verification
router.get('/documents/pending', adminController.getPendingDocuments.bind(adminController));
router.post('/documents/:id/approve', adminController.approveDocument.bind(adminController));
router.post('/documents/:id/reject', adminController.rejectDocument.bind(adminController));

// Property verification
router.get('/properties/pending', adminController.getPendingProperties.bind(adminController));
router.post('/properties/:id/approve', adminController.approveProperty.bind(adminController));
router.post('/properties/:id/reject', adminController.rejectProperty.bind(adminController));

// User management
router.get('/users', adminController.getUsers.bind(adminController));
router.patch('/users/:id/status', adminController.updateUserStatus.bind(adminController));

export default router;
