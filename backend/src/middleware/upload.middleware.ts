import multer from 'multer';
import path from 'path';
import fs from 'fs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const CHAT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const PAYMENT_PROOF_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const ensureDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const createStorage = (subdir: string) => {
    const uploadDir = path.join(process.cwd(), 'uploads', subdir);
    ensureDir(uploadDir);

    return multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const safeOriginal = sanitizeFileName(file.originalname);
            const ext = path.extname(safeOriginal) || path.extname(file.originalname);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    });
};

const createFileFilter = (allowedMimeTypes: string[]) => {
    return (_req: any, file: any, cb: any) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    };
};

export const imageUpload = multer({
    storage: createStorage('images'),
    fileFilter: createFileFilter(IMAGE_MIME_TYPES),
    limits: { fileSize: MAX_FILE_SIZE },
});

export const chatUpload = multer({
    storage: createStorage('chat'),
    fileFilter: createFileFilter(CHAT_MIME_TYPES),
    limits: { fileSize: MAX_FILE_SIZE },
});

export const paymentProofUpload = multer({
    storage: createStorage('payments'),
    fileFilter: createFileFilter(PAYMENT_PROOF_MIME_TYPES),
    limits: { fileSize: MAX_FILE_SIZE },
});

export default imageUpload;
