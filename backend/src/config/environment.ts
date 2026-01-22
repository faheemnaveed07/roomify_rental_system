import { z } from 'zod';

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('5000'),

    // Database (allow typical MongoDB connection string)
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/roomify'),

    // JWT
    JWT_SECRET: z
        .string()
        .min(32)
        .default('dev-secret-please-change-this-to-a-long-secure-string-12345'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Cloudinary (optional for local dev)
    CLOUDINARY_CLOUD_NAME: z.string().optional().nullable().default(''),
    CLOUDINARY_API_KEY: z.string().optional().nullable().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().nullable().default(''),

    // AWS S3 (optional for local dev)
    AWS_ACCESS_KEY_ID: z.string().optional().nullable().default(''),
    AWS_SECRET_ACCESS_KEY: z.string().optional().nullable().default(''),
    AWS_S3_BUCKET: z.string().optional().nullable().default(''),
    AWS_REGION: z.string().default('ap-south-1'),

    // Email (optional for local dev)
    SMTP_HOST: z.string().optional().nullable().default(''),
    SMTP_PORT: z.string().transform(Number).optional().default('587'),
    SMTP_USER: z.string().optional().nullable().default(''),
    SMTP_PASS: z.string().optional().nullable().default(''),
    EMAIL_FROM: z.string().email().optional().default('no-reply@example.com'),

    // Frontend URL
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

const validateEnv = (): EnvConfig => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map((e) => e.path.join('.'));
            throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
        }
        throw error;
    }
};

export const env = validateEnv();

export default env;