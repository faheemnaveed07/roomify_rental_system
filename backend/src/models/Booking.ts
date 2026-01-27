import mongoose, { Schema, Document, Types } from 'mongoose';

import { BookingStatus, BookingType, IBooking as ISharedBooking } from '@shared/types';

export { BookingStatus, BookingType };

export interface IBooking extends Document, Omit<ISharedBooking, '_id' | 'property' | 'tenant' | 'landlord' | 'cancellation' | 'notes'> {
    property: Types.ObjectId;
    tenant: Types.ObjectId;
    landlord: Types.ObjectId;
    cancellation?: {
        cancelledBy: Types.ObjectId;
        reason: string;
        cancelledAt: Date;
    };
    notes: {
        createdBy: Types.ObjectId;
        content: string;
        createdAt: Date;
    }[];
}

const bookingSchema = new Schema<IBooking>(
    {
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: [true, 'Property is required'],
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
        bookingType: {
            type: String,
            enum: Object.values(BookingType),
            required: [true, 'Booking type is required'],
        },
        status: {
            type: String,
            enum: Object.values(BookingStatus),
            default: BookingStatus.PENDING,
        },
        requestMessage: {
            type: String,
            required: [true, 'Request message is required'],
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        responseMessage: {
            type: String,
            maxlength: [1000, 'Response message cannot exceed 1000 characters'],
        },
        proposedMoveInDate: {
            type: Date,
            required: [true, 'Move-in date is required'],
        },
        proposedDuration: {
            value: {
                type: Number,
                required: true,
                min: 1,
            },
            unit: {
                type: String,
                enum: ['months', 'years'],
                default: 'months',
            },
        },
        rentDetails: {
            monthlyRent: {
                type: Number,
                required: true,
            },
            securityDeposit: {
                type: Number,
                default: 0,
            },
            totalAmount: {
                type: Number,
                required: true,
            },
            currency: {
                type: String,
                default: 'PKR',
            },
        },
        bedNumber: {
            type: Number,
            min: 1,
        },
        timeline: {
            requestedAt: {
                type: Date,
                default: Date.now,
            },
            respondedAt: Date,
            approvedAt: Date,
            rejectedAt: Date,
            cancelledAt: Date,
            completedAt: Date,
            expiredAt: Date,
        },
        cancellation: {
            cancelledBy: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            reason: String,
            cancelledAt: Date,
        },
        notes: [
            {
                createdBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
bookingSchema.index({ property: 1, tenant: 1 });
bookingSchema.index({ landlord: 1, status: 1 });
bookingSchema.index({ tenant: 1, status: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate total amount
bookingSchema.pre('save', function (next) {
    if (this.isModified('rentDetails.monthlyRent') || this.isModified('proposedDuration')) {
        const months =
            this.proposedDuration.unit === 'years'
                ? this.proposedDuration.value * 12
                : this.proposedDuration.value;
        this.rentDetails.totalAmount =
            this.rentDetails.monthlyRent * months + this.rentDetails.securityDeposit;
    }
    next();
});

// Virtual to check if booking is expired
bookingSchema.virtual('isExpired').get(function () {
    return this.status === BookingStatus.PENDING && new Date() > this.expiresAt;
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
