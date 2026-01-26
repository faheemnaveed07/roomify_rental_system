export interface S3UploadParams {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType: string;
    metadata?: Record<string, string>;
}

export interface S3UploadResult {
    key: string;
    bucket: string;
    location: string;
}

export const uploadToS3 = async (params: S3UploadParams): Promise<S3UploadResult> => {
    // Mock implementation for verified build
    return {
        key: params.key,
        bucket: 'roomify-mock-bucket',
        location: `https://roomify-mock.s3.amazonaws.com/${params.key}`,
    };
};

export const deleteFromS3 = async (_key: string): Promise<boolean> => {
    return true;
};

export default { uploadToS3, deleteFromS3 };
