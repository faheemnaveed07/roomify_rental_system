import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import adminRoutes from './admin.routes';
import bookingRoutes from './booking.routes';

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

export default router;
