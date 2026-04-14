import { useState } from 'react';
import { IPropertyImage } from '@shared/types';
import api from '../services/api';

interface UseLocalUploadReturn {
    uploadImages: (files: File[]) => Promise<IPropertyImage[]>;
    uploading: boolean;
    error: string | null;
}

export const useLocalUpload = (): UseLocalUploadReturn => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadImages = async (files: File[]): Promise<IPropertyImage[]> => {
        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('images', file);
            });

            // ✅ Use the shared axios instance with httpOnly cookies + auto-refresh
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to upload images';
            setError(message);
            throw new Error(message);
        } finally {
            setUploading(false);
        }
    };

    return { uploadImages, uploading, error };
};
