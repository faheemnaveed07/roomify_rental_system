import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, UserStatus } from '@shared/types/user.types';

// Omit use kiya hai taake _id aur interface ka conflict khatam ho jaye
export interface IUserDocument extends Document, Omit<IUser, '_id'> {
    _id: mongoose.Types.ObjectId;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^(\+92|0)?3[0-9]{9}$/, 'Please use a valid Pakistani phone number'],
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.TENANT,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.PENDING,
        },
        avatar: {
            type: String,
            default: null,
        },
        cnicNumber: {
            type: String,
            match: [/^[0-9]{5}-[0-9]{7}-[0-9]$/, 'Please use a valid CNIC format (XXXXX-XXXXXXX-X)'],
        },
        cnicVerified: { type: Boolean, default: false },
        emailVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        lastLogin: {
            type: Date,
            default: null,
        },
        refreshToken: {
            type: String,
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                const response = ret as any;
                delete response.password;
                delete response.refreshToken;
                delete response.__v;
                return response;
            },
        },
    }
);

// Indexes
// `email` already has `unique: true` in the field definition — remove separate index to avoid duplicates
userSchema.index({ phone: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string): Promise<IUserDocument | null> {
    return this.findOne({ email: email.toLowerCase() }).select('+password');
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
export default User;