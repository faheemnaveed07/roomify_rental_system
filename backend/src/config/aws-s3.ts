// import {
//     S3Client,
//     PutObjectCommand,
//     GetObjectCommand,
//     DeleteObjectCommand,
//     PutObjectCommandInput,
//     GetObjectCommandInput,
//     DeleteObjectCommandInput,
// } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { env } from './environment';

// const s3Config = {
//     region: env.AWS_REGION,
//     credentials: {
//         accessKeyId: env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
//     },
// };

// export const s3Client = new S3Client(s3Config);

// export interface S3UploadParams {
//     key: string;
//     body: Buffer | Uint8Array | string;
//     contentType: string;
//     metadata?: Record<string, string>;
// }

// export interface S3UploadResult {
//     key: string;
//     bucket: string;
//     location: string;
// }

// export const uploadToS3 = async (params: S3UploadParams): Promise<S3UploadResult> => {
//     const uploadParams: PutObjectCommandInput = {
//         Bucket: env.AWS_S3_BUCKET,
//         Key: params.key,
//         Body: params.body,
//         ContentType: params.contentType,
//         Metadata: params.metadata,
//     };

//     await s3Client.send(new PutObjectCommand(uploadParams));

//     return {
//         key: params.key,
//         bucket: env.AWS_S3_BUCKET,
//         location: `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${params.key}`,
//     };
// };

// export const getSignedDownloadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
//     const params: GetObjectCommandInput = {
//         Bucket: env.AWS_S3_BUCKET,
//         Key: key,
//     };

//     const command = new GetObjectCommand(params);
//     return getSignedUrl(s3Client, command, { expiresIn });
// };

// export const deleteFromS3 = async (key: string): Promise<boolean> => {
//     const params: DeleteObjectCommandInput = {
//         Bucket: env.AWS_S3_BUCKET,
//         Key: key,
//     };

//     await s3Client.send(new DeleteObjectCommand(params));
//     return true;
// };

// export default s3Client;
