import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { ApiResponse } from '@shared/types';

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload multiple images to Cloudinary
 * @access  Private
 */
router.post('/', authenticate, upload.array('images', 10), (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedImages = files.map((file) => ({
            url: `/uploads/${file.filename}`, // Local URL relative to backend
            publicId: file.filename, // Local filename as ID
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

export default router;
