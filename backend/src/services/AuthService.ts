import jwt, { SignOptions } from 'jsonwebtoken';
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
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

/** Hash a raw token with SHA-256 for safe DB storage */
const hashToken = (raw: string): string =>
    crypto.createHash('sha256').update(raw).digest('hex');

export class AuthService {
    private readonly accessTokenExpiry: string;
    private readonly refreshTokenExpiry: string;

    constructor() {
        this.accessTokenExpiry = env.JWT_EXPIRES_IN || '1h';
        this.refreshTokenExpiry = '30d';
    }

    async register(userData: IUserRegistration): Promise<{ user: IUserDocument; tokens: IAuthTokens }> {
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Generate a one-time email verification token (raw → hashed in DB)
        const rawVerifyToken = crypto.randomBytes(32).toString('hex');
        const hashedVerifyToken = hashToken(rawVerifyToken);
        const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

        const user = await User.create({
            ...userData,
            email: userData.email.toLowerCase(),
            role: userData.role || UserRole.TENANT,
            status: UserStatus.PENDING,
            emailVerificationToken: hashedVerifyToken,
            emailVerificationExpires: verifyExpires,
        });

        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Best-effort: send verification email (don't fail registration if SMTP is down)
        sendVerificationEmail(user.email, user.firstName, rawVerifyToken).catch((err) =>
            logger.warn('Failed to send verification email:', err)
        );

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

    async verifyEmail(rawToken: string): Promise<IUserDocument> {
        const hashed = hashToken(rawToken);

        const user = await User.findOne({
            emailVerificationToken: hashed,
            emailVerificationExpires: { $gt: new Date() },
        }).select('+emailVerificationToken +emailVerificationExpires');

        if (!user) {
            throw new Error('Verification link is invalid or has expired');
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        if (user.status === UserStatus.PENDING) {
            user.status = UserStatus.ACTIVE;
        }
        await user.save();

        logger.info(`Email verified for user: ${user.email}`);
        return user;
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await User.findOne({ email: email.toLowerCase() });
        // Always return success — don't leak whether email exists
        if (!user) {
            logger.info(`Password reset requested for non-existent email: ${email}`);
            return;
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = hashToken(rawToken);
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = expires;
        // Save without re-hashing password
        await user.save({ validateModifiedOnly: true });

        sendPasswordResetEmail(user.email, user.firstName, rawToken).catch((err) =>
            logger.warn('Failed to send password reset email:', err)
        );

        logger.info(`Password reset email sent to: ${email}`);
    }

    async resetPassword(rawToken: string, newPassword: string): Promise<void> {
        const hashed = hashToken(rawToken);

        const user = await User.findOne({
            passwordResetToken: hashed,
            passwordResetExpires: { $gt: new Date() },
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            throw new Error('Password reset link is invalid or has expired');
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        // Invalidate all existing sessions
        user.refreshToken = undefined as unknown as string;
        await user.save();

        logger.info(`Password reset for user: ${user.email}`);
    }

    generateTokens(user: IUserDocument): IAuthTokens {
        const payload: ITokenPayload = {
            userId: (user._id as unknown as { toString(): string }).toString(),
            email: user.email,
            role: user.role,
        };

        const accessTokenOptions: SignOptions = {
            expiresIn: this.accessTokenExpiry as SignOptions['expiresIn'],
        };

        const refreshTokenOptions: SignOptions = {
            expiresIn: this.refreshTokenExpiry as SignOptions['expiresIn'],
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, accessTokenOptions);
        // Use a separate secret for refresh tokens
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);

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
            return jwt.verify(token, env.JWT_REFRESH_SECRET) as ITokenPayload;
        } catch {
            return null;
        }
    }

    generateEmailVerificationToken(user: IUserDocument): string {
        const payload: ITokenPayload = {
            userId: (user._id as unknown as { toString(): string }).toString(),
            email: user.email,
            role: user.role,
        };
        return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' as SignOptions['expiresIn'] });
    }
}

export const authService = new AuthService();
export default AuthService;