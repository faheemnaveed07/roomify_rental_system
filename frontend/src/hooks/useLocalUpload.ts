import { useState } from 'react';
import axios from 'axios';
import { IPropertyImage } from '@shared/types';

interface UseLocalUploadReturn {
    uploadImages: (files: File[]) => Promise<IPropertyImage[]>;
    uploading: boolean;
    error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
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
