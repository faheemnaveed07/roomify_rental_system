import mongoose, { Schema, Document, Types } from 'mongoose';

export enum DocumentType {
    CNIC_FRONT = 'cnic_front',
    CNIC_BACK = 'cnic_back',
    OWNERSHIP_PROOF = 'ownership_proof',
    UTILITY_BILL = 'utility_bill',
    RENTAL_AGREEMENT = 'rental_agreement',
    PROPERTY_IMAGE = 'property_image',
    PROFILE_PHOTO = 'profile_photo',
    OTHER = 'other',
}

export enum DocumentStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface IDocument extends Document {
    user: Types.ObjectId;
    property?: Types.ObjectId;
    documentType: DocumentType;
    status: DocumentStatus;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    publicId: string;
    storageProvider: 'cloudinary' | 's3';
    metadata: {
        extractedData?: Record<string, unknown>;
        verificationNotes?: string;
        rejectionReason?: string;
    };
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Document must belong to a user'],
        },
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
        },
        documentType: {
            type: String,
            enum: Object.values(DocumentType),
            required: [true, 'Document type is required'],
        },
        status: {
            type: String,
            enum: Object.values(DocumentStatus),
            default: DocumentStatus.PENDING,
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
        },
        originalName: {
            type: String,
            required: [true, 'Original file name is required'],
        },
        mimeType: {
            type: String,
            required: [true, 'MIME type is required'],
        },
        size: {
            type: Number,
            required: [true, 'File size is required'],
        },
        url: {
            type: String,
            required: [true, 'File URL is required'],
        },
        publicId: {
            type: String,
            required: [true, 'Public ID is required'],
        },
        storageProvider: {
            type: String,
            enum: ['cloudinary', 's3'],
            required: true,
        },
        metadata: {
            extractedData: {
                type: Schema.Types.Mixed,
                default: {},
            },
            verificationNotes: String,
            rejectionReason: String,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: Date,
        expiresAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
documentSchema.index({ user: 1, documentType: 1 });
documentSchema.index({ property: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });

// Virtual to check if document is expired
documentSchema.virtual('isExpired').get(function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
});

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;
