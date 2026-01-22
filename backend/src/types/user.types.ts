import { Types } from 'mongoose';

export enum UserRole {
    TENANT = 'tenant',
    LANDLORD = 'landlord',
    ADMIN = 'admin',
}

export enum UserStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DEACTIVATED = 'deactivated',
}

export interface IUser {
    _id?: Types.ObjectId;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    avatar: string | null;
    cnicNumber?: string;
    cnicVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLogin: Date | null;
    refreshToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserPublic {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    avatar: string | null;
    cnicVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: Date;
}

export interface IUserRegistration {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role?: UserRole;
}

export interface IUserLogin {
    email: string;
    password: string;
}

export interface IUserUpdate {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    cnicNumber?: string;
}

export interface IPasswordChange {
    currentPassword: string;
    newPassword: string;
}

export interface ITokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

export interface IAuthTokens {
    accessToken: string;
    refreshToken: string;
}
