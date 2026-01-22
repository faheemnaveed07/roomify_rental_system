import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { userRegistrationSchema, userLoginSchema } from '../utils/validators';
import { ApiResponse, AuthResponse } from '../types/api.types';
import { IUserRegistration } from '../types/user.types';
import { logger } from '../utils/logger';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // validatedData ko explicit type cast kiya hai taake Enum mismatch khatam ho jaye
            const validatedData = userRegistrationSchema.parse(req.body) as IUserRegistration;
            const { user, tokens } = await authService.register(validatedData);

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
                    tokens,
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
                    tokens,
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
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                });
                return;
            }

            const tokens = await authService.refreshTokens(refreshToken);

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
            const { token } = req.params;
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
            await authService.requestPasswordReset(email);

            const response: ApiResponse = {
                success: true,
                message: 'Password reset email sent',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token } = req.params;
            const { password } = req.body;
            await authService.resetPassword(token, password);

            const response: ApiResponse = {
                success: true,
                message: 'Password reset successfully',
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            // Dynamic import logic ko simple kiya gaya hai
            const { User } = await import('../models/User');
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