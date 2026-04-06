import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import adminRoutes from './admin.routes';
import bookingRoutes from './booking.routes';
import landlordRoutes from './landlord.routes';
import uploadRoutes from './upload.routes';
import chatRoutes from './chat.routes';
import paymentRoutes from './payment.routes';
import agreementRoutes from './agreement.routes';
import matchingRoutes from './matching.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Roomify API is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/admin', adminRoutes);
router.use('/bookings', bookingRoutes);
router.use('/landlord', landlordRoutes);
router.use('/upload', uploadRoutes);
router.use('/chat', chatRoutes);
router.use('/payments', paymentRoutes);
router.use('/agreements', agreementRoutes);
router.use('/matching', matchingRoutes);

export default router;
