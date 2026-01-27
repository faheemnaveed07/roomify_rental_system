import { Types } from 'mongoose';
import fs from 'fs';
import { DocumentModel, IDocument, DocumentType, DocumentStatus } from '../models/Document';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { UserStatus } from '@shared/types/user.types';
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

type UploadResult = {
    location: string;
    key: string;
    provider: 'local';
};

export class VerificationService {
    async uploadDocument(
        userId: string,
        file: UploadedFile,
        documentType: DocumentType,
        propertyId?: string
    ): Promise<IDocument> {
        // Since we are using local storage, the file is already in the uploads/ folder
        // We just need to store the relative path
        const relativePath = file.path.includes('uploads')
            ? file.path.substring(file.path.indexOf('uploads') - 1).replace(/\\/g, '/')
            : `/uploads/${file.path}`;

        const uploadResult: UploadResult = {
            location: relativePath,
            key: file.originalname,
            provider: 'local'
        };

        const document = await DocumentModel.create({
            user: new Types.ObjectId(userId),
            property: propertyId ? new Types.ObjectId(propertyId) : undefined,
            documentType,
            status: DocumentStatus.PENDING,
            fileName: file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: uploadResult.location,
            publicId: uploadResult.key,
            storageProvider: uploadResult.provider,
        });

        logger.info(`Document uploaded: ${document._id} for user: ${userId}`);
        return document;
    }

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

        // Delete from local storage
        if (document.storageProvider === 'local') {
            const fs = require('fs');
            const path = require('path');
            const absolutePath = path.join(process.cwd(), document.url);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
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