import { Router } from 'express';
import mongoose from 'mongoose';
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
import roommateProfileRoutes from './roommateProfile.routes';
import verificationRoutes from './verification.routes';

const router = Router();

// Health check — also reports MongoDB connection state so DB issues are
// diagnosable straight from the browser (GET /api/health).
router.get('/health', (_req, res) => {
    const DB_STATES: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized',
    };
    const readyState = mongoose.connection.readyState;
    res.json({
        success: true,
        message: 'Domavi API is running',
        db: DB_STATES[readyState] ?? 'unknown',
        dbConnected: readyState === 1,
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
router.use('/roommate-profile', roommateProfileRoutes);
router.use('/verification', verificationRoutes);

export default router;
