import { Types } from 'mongoose';
import { DocumentModel, IDocument, DocumentType, DocumentStatus } from '../models/Document';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { UserStatus } from '../types/user.types';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import { uploadToS3, deleteFromS3 } from '../config/aws-s3';
import { sendVerificationStatusEmail } from '../utils/email';
import { logger } from '../utils/logger';

interface UploadedFile {
    path: string;
    originalname: string;
    mimetype: string;
    size: number;
}

interface VerificationResult {
    documentId: string;
    status: DocumentStatus;
    message: string;
}

// ✅ FIXED: Explicit discriminated union types
interface CloudinaryResult {
    secureUrl: string;
    publicId: string;
    provider: 'cloudinary';
}

interface S3Result {
    location: string;
    key: string;
    provider: 's3';
}

type UploadResult = CloudinaryResult | S3Result;

export class VerificationService {
    async uploadDocument(
        userId: string,
        file: UploadedFile,
        documentType: DocumentType,
        propertyId?: string
    ): Promise<IDocument> {
        const isImage = file.mimetype.startsWith('image/');

        // ✅ FIXED: Properly typed result with discriminator
        let uploadResult: UploadResult;

        if (isImage) {
            const cloudinaryResult = await uploadToCloudinary(file.path, {
                folder: `roomify/documents/${userId}`,
                resource_type: 'image',
            });
            uploadResult = {
                secureUrl: cloudinaryResult.secureUrl,
                publicId: cloudinaryResult.publicId,
                provider: 'cloudinary'
            };
        } else {
            const key = `documents/${userId}/${Date.now()}-${file.originalname}`;
            const buffer = await require('fs').promises.readFile(file.path);
            const s3Result = await uploadToS3({
                key,
                body: buffer,
                contentType: file.mimetype,
            });
            uploadResult = {
                location: s3Result.location,
                key: s3Result.key,
                provider: 's3'
            };
        }

        // ✅ FIXED: Type-safe property access using discriminant
        const document = await DocumentModel.create({
            user: new Types.ObjectId(userId),
            property: propertyId ? new Types.ObjectId(propertyId) : undefined,
            documentType,
            status: DocumentStatus.PENDING,
            fileName: file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: uploadResult.provider === 'cloudinary'
                ? uploadResult.secureUrl
                : uploadResult.location,
            publicId: uploadResult.provider === 'cloudinary'
                ? uploadResult.publicId
                : uploadResult.key,
            storageProvider: uploadResult.provider,
        });

        logger.info(`Document uploaded: ${document._id} for user: ${userId}`);
        return document;
    }

    // ... keep all other methods unchanged ...
    async getUserDocuments(
        userId: string,
        documentType?: DocumentType
    ): Promise<IDocument[]> {
        const query: Record<string, unknown> = { user: userId };
        if (documentType) {
            query.documentType = documentType;
        }

        return DocumentModel.find(query).sort({ createdAt: -1 });
    }

    async getPropertyDocuments(propertyId: string): Promise<IDocument[]> {
        return DocumentModel.find({ property: propertyId }).sort({ createdAt: -1 });
    }

    async getPendingDocuments(limit = 50): Promise<IDocument[]> {
        return DocumentModel.find({ status: DocumentStatus.PENDING })
            .populate('user', 'firstName lastName email')
            .populate('property', 'title')
            .sort({ createdAt: 1 })
            .limit(limit);
    }

    async approveDocument(
        documentId: string,
        adminId: string,
        notes?: string
    ): Promise<VerificationResult> {
        const document = await DocumentModel.findById(documentId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.status = DocumentStatus.APPROVED;
        document.reviewedBy = new Types.ObjectId(adminId);
        document.reviewedAt = new Date();
        if (notes) {
            document.metadata.verificationNotes = notes;
        }
        await document.save();

        await this.updateVerificationStatus(document);

        const user = await User.findById(document.user);
        if (user) {
            await sendVerificationStatusEmail(
                user.email,
                user.firstName,
                document.documentType,
                'approved'
            );
        }

        logger.info(`Document approved: ${documentId} by admin: ${adminId}`);

        return {
            documentId: document._id.toString(),
            status: DocumentStatus.APPROVED,
            message: 'Document approved successfully',
        };
    }

    async rejectDocument(
        documentId: string,
        adminId: string,
        reason: string
    ): Promise<VerificationResult> {
        const document = await DocumentModel.findById(documentId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.status = DocumentStatus.REJECTED;
        document.reviewedBy = new Types.ObjectId(adminId);
        document.reviewedAt = new Date();
        document.metadata.rejectionReason = reason;
        await document.save();

        const user = await User.findById(document.user);
        if (user) {
            await sendVerificationStatusEmail(
                user.email,
                user.firstName,
                document.documentType,
                'rejected',
                reason
            );
        }

        logger.info(`Document rejected: ${documentId} by admin: ${adminId}`);

        return {
            documentId: document._id.toString(),
            status: DocumentStatus.REJECTED,
            message: reason,
        };
    }

    async deleteDocument(documentId: string, userId: string): Promise<boolean> {
        const document = await DocumentModel.findOne({
            _id: documentId,
            user: userId,
        });

        if (!document) {
            throw new Error('Document not found');
        }

        if (document.storageProvider === 'cloudinary') {
            await deleteFromCloudinary(document.publicId);
        } else {
            await deleteFromS3(document.publicId);
        }

        await document.deleteOne();

        logger.info(`Document deleted: ${documentId}`);
        return true;
    }

    private async updateVerificationStatus(document: IDocument): Promise<void> {
        const userId = document.user.toString();

        if (
            document.documentType === DocumentType.CNIC_FRONT ||
            document.documentType === DocumentType.CNIC_BACK
        ) {
            const cnicDocs = await DocumentModel.find({
                user: userId,
                documentType: { $in: [DocumentType.CNIC_FRONT, DocumentType.CNIC_BACK] },
                status: DocumentStatus.APPROVED,
            });

            if (cnicDocs.length >= 2) {
                await User.findByIdAndUpdate(userId, {
                    cnicVerified: true,
                    status: UserStatus.ACTIVE,
                });
                logger.info(`User CNIC verified: ${userId}`);
            }
        }

        if (
            document.property &&
            document.documentType === DocumentType.OWNERSHIP_PROOF
        ) {
            await Property.findByIdAndUpdate(document.property, {
                'verificationStatus.ownershipVerified': true,
                'verificationStatus.documentsUploaded': true,
            });

            const property = await Property.findById(document.property);
            if (
                property &&
                property.verificationStatus.ownershipVerified &&
                property.verificationStatus.documentsUploaded
            ) {
                logger.info(`Property ready for final approval: ${document.property}`);
            }
        }
    }

    async checkCnicStatus(userId: string): Promise<{
        isVerified: boolean;
        frontUploaded: boolean;
        backUploaded: boolean;
        frontApproved: boolean;
        backApproved: boolean;
    }> {
        const cnicDocs = await DocumentModel.find({
            user: userId,
            documentType: { $in: [DocumentType.CNIC_FRONT, DocumentType.CNIC_BACK] },
        });

        const frontDoc = cnicDocs.find((d) => d.documentType === DocumentType.CNIC_FRONT);
        const backDoc = cnicDocs.find((d) => d.documentType === DocumentType.CNIC_BACK);

        return {
            isVerified:
                frontDoc?.status === DocumentStatus.APPROVED &&
                backDoc?.status === DocumentStatus.APPROVED,
            frontUploaded: !!frontDoc,
            backUploaded: !!backDoc,
            frontApproved: frontDoc?.status === DocumentStatus.APPROVED,
            backApproved: backDoc?.status === DocumentStatus.APPROVED,
        };
    }

    async getStatistics(): Promise<Record<string, number>> {
        const stats = await DocumentModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const result: Record<string, number> = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
        };

        stats.forEach((stat) => {
            result[stat._id] = stat.count;
            result.total += stat.count;
        });

        return result;
    }
}

export const verificationService = new VerificationService();
export default VerificationService;