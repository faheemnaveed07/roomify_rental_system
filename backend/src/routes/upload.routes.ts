import { Router } from 'express';
import { imageUpload, chatUpload, paymentProofUpload } from '../middleware/upload.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { ApiResponse } from '@shared/types';

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload multiple images to Cloudinary
 * @access  Private
 */
router.post('/', authenticate, imageUpload.array('images', 10), (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedImages = files.map((file) => ({
            url: `/uploads/images/${file.filename}`,
            publicId: file.filename,
            isPrimary: false
        }));

        const response: ApiResponse = {
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedImages
        };

        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Image upload failed'
        });
    }
});

/**
 * @route   POST /api/upload/chat
 * @desc    Upload chat attachments (png/jpg/pdf)
 * @access  Private
 */
router.post('/chat', authenticate, chatUpload.array('attachments', 5), (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedFiles = files.map((file) => ({
            url: `/uploads/chat/${file.filename}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype.includes('pdf') ? 'document' : 'image',
        }));

        const response: ApiResponse = {
            success: true,
            message: 'Attachments uploaded successfully',
            data: uploadedFiles
        };

        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Attachment upload failed'
        });
    }
});

/**
 * @route   POST /api/upload/payment-proof
 * @desc    Upload payment proof (png/jpg/pdf)
 * @access  Private
 */
router.post('/payment-proof', authenticate, paymentProofUpload.single('proof'), (req, res) => {
    try {
        const file = req.file as Express.Multer.File | undefined;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const response: ApiResponse = {
            success: true,
            message: 'Payment proof uploaded successfully',
            data: {
                url: `/uploads/payments/${file.filename}`,
                name: file.originalname,
                size: file.size,
                type: file.mimetype.includes('pdf') ? 'document' : 'image',
            }
        };

        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Payment proof upload failed'
        });
    }
});

export default router;
