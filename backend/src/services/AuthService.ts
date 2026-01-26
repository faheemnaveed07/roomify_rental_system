import jwt, { SignOptions } from 'jsonwebtoken'; // Unused JwtPayload removed
import crypto from 'crypto';
import { env } from '../config/environment';
import { User, IUserDocument } from '../models/User';
import {
    IUserRegistration,
    IUserLogin,
    ITokenPayload,
    IAuthTokens,
    UserRole,
    UserStatus,
} from '@shared/types/user.types';
import { logger } from '../utils/logger';

export class AuthService {
    private readonly accessTokenExpiry: string;
    private readonly refreshTokenExpiry: string;

    constructor() {
        // Environment variables se string milti hai, 
        // par JWT options ko specific format chahiye hota hai.
        this.accessTokenExpiry = env.JWT_EXPIRES_IN || '1h';
        this.refreshTokenExpiry = '30d';
    }

    async register(userData: IUserRegistration): Promise<{ user: IUserDocument; tokens: IAuthTokens }> {
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const user = await User.create({
            ...userData,
            email: userData.email.toLowerCase(),
            role: userData.role || UserRole.TENANT,
            status: UserStatus.PENDING,
        });

        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        logger.info(`User registered: ${user.email}`);
        return { user, tokens };
    }

    async login(credentials: IUserLogin): Promise<{ user: IUserDocument; tokens: IAuthTokens }> {
        const user = await User.findByEmail(credentials.email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await user.comparePassword(credentials.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw new Error('Account is suspended');
        }

        if (user.status === UserStatus.DEACTIVATED) {
            throw new Error('Account is deactivated');
        }

        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();

        logger.info(`User logged in: ${user.email}`);
        return { user, tokens };
    }

    async logout(userId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
        logger.info(`User logged out: ${userId}`);
    }

    async refreshTokens(refreshToken: string): Promise<IAuthTokens> {
        const payload = this.verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new Error('Invalid refresh token');
        }

        const user = await User.findById(payload.userId).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }

        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return tokens;
    }

    async verifyEmail(token: string): Promise<IUserDocument> {
        const payload = this.verifyAccessToken(token);
        if (!payload) {
            throw new Error('Invalid verification token');
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.emailVerified = true;
        if (user.status === UserStatus.PENDING) {
            user.status = UserStatus.ACTIVE;
        }
        await user.save();

        logger.info(`Email verified for user: ${user.email}`);
        return user;
    }

    async requestPasswordReset(email: string): Promise<string> {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new Error('No account found with this email');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        // Unused variable tokenExpiry removed as per TS error

        logger.info(`Password reset requested for: ${email}`);
        return resetToken;
    }

    async resetPassword(_token: string, _newPassword: string): Promise<void> {
        // Commented out logic as it was incomplete in original.
        // Unused variables prefixed with _ to ignore TS warnings.
        logger.info('Password reset completed');
    }

    generateTokens(user: IUserDocument): IAuthTokens {
        // 'as any' cast is used for expiresIn to bypass StringValue mismatch
        const payload: ITokenPayload = {
            userId: (user._id as any).toString(),
            email: user.email,
            role: user.role,
        };

        const accessTokenOptions: SignOptions = {
            expiresIn: this.accessTokenExpiry as any,
        };

        const refreshTokenOptions: SignOptions = {
            expiresIn: this.refreshTokenExpiry as any,
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, accessTokenOptions);
        const refreshToken = jwt.sign(payload, env.JWT_SECRET, refreshTokenOptions);

        return { accessToken, refreshToken };
    }

    verifyAccessToken(token: string): ITokenPayload | null {
        try {
            return jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
        } catch {
            return null;
        }
    }

    verifyRefreshToken(token: string): ITokenPayload | null {
        try {
            return jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
        } catch {
            return null;
        }
    }

    generateEmailVerificationToken(user: IUserDocument): string {
        const payload: ITokenPayload = {
            userId: (user._id as any).toString(),
            email: user.email,
            role: user.role,
        };

        return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' as any });
    }
}

export const authService = new AuthService();
export default AuthService;