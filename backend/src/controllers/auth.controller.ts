import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { userRegistrationSchema, userLoginSchema } from '../utils/validators';
import { ApiResponse, AuthResponse } from '@shared/types/api.types';
import { IUserRegistration } from '@shared/types/user.types';
import { User } from '../models/User';
import { env } from '../config/environment';

// ─── Helper: Set Auth Cookies ────────────────────────────────────────
const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
    const isProduction = env.NODE_ENV === 'production';

    // Access token: 1 hour
    res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
    });

    // Refresh token: 30 days
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
    });
};

// ─── Helper: Clear Auth Cookies ──────────────────────────────────────
const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
};

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // validatedData ko explicit type cast kiya hai taake Enum mismatch khatam ho jaye
            const validatedData = userRegistrationSchema.parse(req.body) as IUserRegistration;
            const { user, tokens } = await authService.register(validatedData);

            // ✅ Set httpOnly cookies for tokens
            setAuthCookies(res, tokens);

            const response: ApiResponse<AuthResponse> = {
                success: true,
                message: 'Registration successful. Please verify your email.',
                data: {
                    user: {
                        // Cast to any to safely access _id
                        id: (user._id as any).toString(),
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        avatar: user.avatar,
                    },
                    tokens, // Still send tokens for mobile apps (optional)
                },
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = userLoginSchema.parse(req.body);
            const { user, tokens } = await authService.login(validatedData);

            // ✅ Set httpOnly cookies for tokens
            setAuthCookies(res, tokens);

            const response: ApiResponse<AuthResponse> = {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: (user._id as any).toString(),
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        avatar: user.avatar,
                    },
                    tokens, // Still send tokens for mobile apps (optional)
                },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // req.user ko any cast kiya hai taake Express type errors na aayein
            const userId = (req as any).user?.userId;
            if (userId) {
                await authService.logout(userId);
            }

            // ✅ Clear httpOnly cookies
            clearAuthCookies(res);

            const response: ApiResponse = {
                success: true,
                message: 'Logged out successfully',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // ✅ Read refresh token from httpOnly cookie
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                });
                return;
            }

            const tokens = await authService.refreshTokens(refreshToken);

            // ✅ Set new cookies
            setAuthCookies(res, tokens);

            const response: ApiResponse<{ tokens: typeof tokens }> = {
                success: true,
                message: 'Token refreshed successfully',
                data: { tokens },
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Support both GET /verify-email/:token and GET /verify-email?token=...
            const token = (req.params.token as string | undefined) || (req.query.token as string | undefined);
            if (!token) {
                res.status(400).json({ success: false, message: 'Verification token is required' });
                return;
            }
            await authService.verifyEmail(token);

            const response: ApiResponse = {
                success: true,
                message: 'Email verified successfully',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'Email is required' });
                return;
            }
            // Always return 200 — don't leak whether email exists
            await authService.requestPasswordReset(email);

            const response: ApiResponse = {
                success: true,
                message: 'If an account with that email exists, a reset link has been sent.',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Support both /reset-password/:token and ?token= query param
            const token = (req.params.token as string | undefined) || (req.query.token as string | undefined);
            const { password } = req.body;
            if (!token || !password) {
                res.status(400).json({ success: false, message: 'Token and new password are required' });
                return;
            }
            await authService.resetPassword(token, password);

            const response: ApiResponse = {
                success: true,
                message: 'Password reset successfully. Please log in.',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;

            const user = await User.findById(userId);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Profile retrieved successfully',
                data: user,
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
export default authController;