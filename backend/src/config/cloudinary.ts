import { v2 as cloudinary, ConfigOptions, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { env } from './environment';

const cloudinaryConfig: ConfigOptions = {
    cloud_name: env.CLOUDINARY_CLOUD_NAME as string,
    api_key: env.CLOUDINARY_API_KEY as string,
    api_secret: env.CLOUDINARY_API_SECRET as string,
    secure: true,
};

cloudinary.config(cloudinaryConfig);

export interface CloudinaryUploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
}

export const uploadToCloudinary = async (
    filePath: string,
    options?: UploadApiOptions
): Promise<CloudinaryUploadResult> => {
    const defaultOptions: UploadApiOptions = {
        folder: 'roomify',
        resource_type: 'auto',
        ...options,
    };

    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, defaultOptions);

    return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
    };
};

export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
};

export const getCloudinaryUrl = (publicId: string, options?: Record<string, unknown>): string => {
    return cloudinary.url(publicId, options);
};

export { cloudinary };

export default cloudinary;
