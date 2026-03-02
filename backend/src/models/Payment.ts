import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPayment as ISharedPayment, PaymentMethod, PaymentStatus, PaymentType } from '@shared/types';

export { PaymentMethod, PaymentStatus, PaymentType };

export interface IPaymentDocument extends Document, Omit<ISharedPayment, '_id' | 'booking' | 'tenant' | 'landlord' | 'property' | 'confirmedBy'> {
    booking: Types.ObjectId;
    tenant: Types.ObjectId;
    landlord: Types.ObjectId;
    property: Types.ObjectId;
    confirmedBy?: Types.ObjectId;
}

const bankDetailsSchema = new Schema({
    bankName: { type: String, required: true },
    accountTitle: { type: String, required: true },
    accountNumber: { type: String, required: true },
    iban: { type: String },
    branchCode: { type: String },
}, { _id: false });

const cashCollectionSchema = new Schema({
    scheduledDate: { type: Date },
    location: { type: String },
    collectedAt: { type: Date },
    collectedBy: { type: String },
    notes: { type: String },
}, { _id: false });

const paymentSchema = new Schema<IPaymentDocument>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'Booking is required'],
            index: true,
        },
        tenant: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Tenant is required'],
        },
        landlord: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Landlord is required'],
        },
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: [true, 'Property is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount must be positive'],
        },
        currency: {
            type: String,
            default: 'PKR',
        },
        paymentType: {
            type: String,
            enum: Object.values(PaymentType),
            required: [true, 'Payment type is required'],
        },
        paymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            required: [true, 'Payment method is required'],
        },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
        },
        bankDetails: bankDetailsSchema,
        transactionReference: {
            type: String,
            trim: true,
        },
        proofOfPayment: {
            type: String, // URL to uploaded receipt
        },
        cashCollectionDetails: cashCollectionSchema,
        confirmedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        confirmedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        paidAt: {
            type: Date,
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
paymentSchema.index({ tenant: 1, status: 1 });
paymentSchema.index({ landlord: 1, status: 1 });
paymentSchema.index({ booking: 1, paymentType: 1 });
paymentSchema.index({ dueDate: 1, status: 1 });

export const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);
export default Payment;
