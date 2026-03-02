import mongoose, { Schema, Document, Types } from 'mongoose';
import { ILandlordBankAccount as ISharedBankAccount } from '@shared/types';

export interface ILandlordBankAccountDocument extends Document, Omit<ISharedBankAccount, '_id' | 'landlord'> {
    landlord: Types.ObjectId;
}

const landlordBankAccountSchema = new Schema<ILandlordBankAccountDocument>(
    {
        landlord: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Landlord is required'],
            index: true,
        },
        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true,
        },
        accountTitle: {
            type: String,
            required: [true, 'Account title is required'],
            trim: true,
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
            trim: true,
        },
        iban: {
            type: String,
            trim: true,
            match: [/^PK[0-9]{2}[A-Z]{4}[0-9]{16}$/, 'Please use a valid Pakistani IBAN format'],
        },
        branchCode: {
            type: String,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Only one default account per landlord
landlordBankAccountSchema.index({ landlord: 1, isDefault: 1 });

export const LandlordBankAccount = mongoose.model<ILandlordBankAccountDocument>('LandlordBankAccount', landlordBankAccountSchema);
export default LandlordBankAccount;
