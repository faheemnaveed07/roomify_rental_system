import mongoose, { Document, Schema } from 'mongoose';

export type AgreementStatus = 'generated' | 'signed';

export interface IAgreement {
    booking: mongoose.Types.ObjectId;
    tenant: mongoose.Types.ObjectId;
    landlord: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId;
    status: AgreementStatus;
    pdfPath: string;
    pdfUrl: string;
    tenantSignedAt?: Date;
    landlordSignedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAgreementDocument extends IAgreement, Document {}

const AgreementSchema = new Schema<IAgreementDocument>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            unique: true, // one agreement per booking
        },
        tenant: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        landlord: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },
        status: {
            type: String,
            enum: ['generated', 'signed'],
            default: 'generated',
        },
        pdfPath: {
            type: String,
            required: true,
        },
        pdfUrl: {
            type: String,
            required: true,
        },
        tenantSignedAt: {
            type: Date,
        },
        landlordSignedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const Agreement = mongoose.model<IAgreementDocument>('Agreement', AgreementSchema);
