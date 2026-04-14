import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
    authLimiter,
    passwordLimiter,
    refreshLimiter,
    emailVerificationLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

// ✅ Public routes with rate limiting for security

// Authentication endpoints (strict rate limiting: 5 req/15 min)
router.post('/register', authLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));

// Token refresh (moderate rate limiting: 10 req/15 min)
router.post('/refresh-token', refreshLimiter, authController.refreshToken.bind(authController));

// Email verification (moderate rate limiting: 5 req/1 hour)
// Support both /verify-email/:token (old) and /verify-email?token= (new)
router.get('/verify-email/:token', emailVerificationLimiter, authController.verifyEmail.bind(authController));
router.get('/verify-email', emailVerificationLimiter, authController.verifyEmail.bind(authController));

// Password reset endpoints (strict rate limiting: 3 req/1 hour)
router.post('/forgot-password', passwordLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', passwordLimiter, authController.resetPassword.bind(authController));
router.post('/reset-password/:token', passwordLimiter, authController.resetPassword.bind(authController));

// ✅ Protected routes (no additional rate limiting needed)
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));

export default router;
