import { z } from 'zod';

// Pakistan-specific CNIC validation (format: XXXXX-XXXXXXX-X)
export const cnicSchema = z.string().regex(
    /^[0-9]{5}-[0-9]{7}-[0-9]$/,
    'Invalid CNIC format. Expected: XXXXX-XXXXXXX-X'
);

// Pakistan phone number validation
export const phoneSchema = z.string().regex(
    /^(\+92|0)?3[0-9]{9}$/,
    'Invalid phone number. Please use Pakistani format (e.g., +923001234567 or 03001234567)'
);

// Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Coordinates validation
export const coordinatesSchema = z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90),   // latitude
]);

// Rent amount validation (PKR)
export const rentSchema = z.number()
    .min(0, 'Rent cannot be negative')
    .max(10000000, 'Rent amount seems too high');

// Property size validation
export const propertySizeSchema = z.object({
    value: z.coerce.number().positive('Size must be positive'),
    unit: z.enum(['sqft', 'sqm', 'marla', 'kanal']),
});

// Custom validation functions
export const isValidCnic = (cnic: string): boolean => {
    return cnicSchema.safeParse(cnic).success;
};

export const isValidPhone = (phone: string): boolean => {
    return phoneSchema.safeParse(phone).success;
};

export const isValidPassword = (password: string): boolean => {
    return passwordSchema.safeParse(password).success;
};

export const isValidEmail = (email: string): boolean => {
    return emailSchema.safeParse(email).success;
};

export const isValidCoordinates = (coords: [number, number]): boolean => {
    return coordinatesSchema.safeParse(coords).success;
};

// Sanitize string input
export const sanitizeString = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
};

// Validate pagination params
/**
 * Whitelist of sortable property fields. NEVER accept arbitrary strings here —
 * an unknown sortBy hitting Mongo can cause table scans or, worse, leak operator
 * names into the sort spec. Add fields explicitly as the product needs them.
 */
export const PROPERTY_SORT_FIELDS = [
    'createdAt',
    'rent.amount',
    'views',
    'inquiries',
    'updatedAt',
] as const;
export type PropertySortField = (typeof PROPERTY_SORT_FIELDS)[number];

export const paginationSchema = z.object({
    page: z.string().optional().transform((val) => Math.max(1, parseInt(val || '1', 10) || 1)),
    limit: z.string().optional().transform((val) => Math.min(Math.max(1, parseInt(val || '10', 10) || 10), 100)),
    sortBy: z.enum(PROPERTY_SORT_FIELDS).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Search query validator. All values arrive as strings (or string[]) from
 * Express; coerce + bound here so the controller stays dumb.
 *
 * Notes:
 *  - `amenities` may arrive as ?amenities=wifi&amenities=ac (string[]) or as a
 *    single ?amenities=wifi — accept both.
 *  - All numeric ranges are clamped; NaN turns into undefined (not 0/Infinity).
 *  - `q` is sanitized to strip Mongo regex metacharacters (defense-in-depth on
 *    top of the $regex usage in the service).
 */
const optNumber = z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
        if (v === undefined || v === '' || v === null) return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : undefined;
    });

const optStringList = z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
        if (!v) return undefined;
        const arr = Array.isArray(v) ? v : [v];
        const cleaned = arr.map((s) => s.trim()).filter(Boolean);
        return cleaned.length > 0 ? cleaned : undefined;
    });

const optBool = z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => {
        if (v === undefined || v === '') return undefined;
        if (typeof v === 'boolean') return v;
        if (v === 'true' || v === '1') return true;
        if (v === 'false' || v === '0') return false;
        return undefined;
    });

const sanitizeRegexInput = (s: string) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);

export const propertySearchQuerySchema = z.object({
    q: z.string().optional().transform((v) => (v ? sanitizeRegexInput(v) : undefined)),
    city: z.string().max(50).optional().transform((v) => (v && v.toLowerCase() !== 'all' ? v : undefined)),
    area: z.string().max(50).optional(),
    propertyType: z
        .enum(['shared_room', 'full_house'])
        .optional()
        .or(z.literal('all').transform(() => undefined)),
    minRent: optNumber.pipe(z.number().min(0).max(10_000_000).optional()),
    maxRent: optNumber.pipe(z.number().min(0).max(10_000_000).optional()),
    minBedrooms: optNumber.pipe(z.number().int().min(0).max(20).optional()),
    maxBedrooms: optNumber.pipe(z.number().int().min(0).max(20).optional()),
    amenities: optStringList,
    genderPreference: z.enum(['male', 'female', 'any']).optional(),
    furnished: optBool,
    availableFrom: z
        .string()
        .optional()
        .transform((v) => (v ? new Date(v) : undefined))
        .pipe(z.date().optional()),
    // Geo
    lat: optNumber.pipe(z.number().min(-90).max(90).optional()),
    lng: optNumber.pipe(z.number().min(-180).max(180).optional()),
    radius: optNumber.pipe(z.number().min(0.1).max(500).optional()),
}).refine(
    (data) => !data.minRent || !data.maxRent || data.minRent <= data.maxRent,
    { message: 'minRent must be ≤ maxRent', path: ['minRent'] },
).refine(
    (data) => (data.lat == null && data.lng == null) || (data.lat != null && data.lng != null),
    { message: 'lat and lng must be provided together', path: ['lat'] },
);

export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;

// User registration validation
export const userRegistrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(2).max(50).transform(sanitizeString),
    lastName: z.string().min(2).max(50).transform(sanitizeString),
    phone: phoneSchema,
    role: z.enum(['tenant', 'landlord']).optional(),
});

// User login validation
export const userLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

// Property creation validation
export const propertyCreateSchema = z.object({
    title: z.string().min(5).max(100).transform(sanitizeString),
    description: z.string().min(20).max(2000).transform(sanitizeString),
    propertyType: z.enum(['shared_room', 'full_house']),
    location: z.object({
        coordinates: coordinatesSchema,
        address: z.string().min(5).max(200),
        city: z.string().min(2).max(50),
        area: z.string().min(2).max(50),
        postalCode: z.string().optional(),
    }),
    rent: z.object({
        amount: z.coerce.number().min(0, 'Rent cannot be negative'),
        paymentFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
        securityDeposit: z.coerce.number().min(0).optional(),
    }),
    size: propertySizeSchema,
    images: z.array(z.object({
        url: z.string().url().or(z.string().startsWith('/uploads/')),
        publicId: z.string(),
        isPrimary: z.boolean().default(false),
    })).min(1, 'At least one image is required'),
    amenities: z.array(z.string()).optional(),
    sharedRoomDetails: z.object({
        totalBeds: z.coerce.number().int().positive(),
        availableBeds: z.coerce.number().int().min(0),
        genderPreference: z.enum(['male', 'female', 'any']).optional(),
    }).optional(),
    fullHouseDetails: z.object({
        bedrooms: z.coerce.number().int().positive(),
        bathrooms: z.coerce.number().int().positive(),
        floors: z.coerce.number().int().positive().optional(),
        parkingSpaces: z.coerce.number().int().min(0).optional(),
        furnishingStatus: z.enum(['furnished', 'semi-furnished', 'unfurnished']).optional(),
    }).optional(),
});

// Booking request validation
export const bookingRequestSchema = z.object({
    propertyId: z.string().refine(isValidObjectId, 'Invalid property ID'),
    requestMessage: z.string().min(10).max(1000).transform(sanitizeString),
    proposedMoveInDate: z.string().transform((val) => new Date(val)),
    proposedDuration: z.object({
        value: z.number().int().positive(),
        unit: z.enum(['months', 'years']),
    }),
    bedNumber: z.number().int().positive().optional(),
});

// Roommate profile validation
export const roommateProfileSchema = z.object({
    bio: z.string().max(500).optional().transform((val) => val ? sanitizeString(val) : ''),
    occupation: z.string().min(2).max(50).transform(sanitizeString),
    age: z.number().int().min(18).max(100),
    gender: z.enum(['male', 'female', 'other']),
    budget: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
    }).refine((data) => data.max >= data.min, 'Max budget must be >= min budget'),
    preferredLocations: z.array(z.string().transform(sanitizeString)).optional(),
    moveInDate: z.string().transform((val) => new Date(val)),
    lifestyle: z.object({
        sleepSchedule: z.enum(['early_bird', 'night_owl', 'flexible']).optional(),
        workSchedule: z.enum(['work_from_home', 'office', 'hybrid', 'student']).optional(),
        cleanlinessLevel: z.number().int().min(1).max(5).optional(),
        noiseLevel: z.enum(['quiet', 'moderate', 'social']).optional(),
        guestsFrequency: z.enum(['never', 'rarely', 'sometimes', 'often']).optional(),
        cookingFrequency: z.enum(['never', 'rarely', 'sometimes', 'daily']).optional(),
    }).optional(),
    preferences: z.object({
        smokingPreference: z.enum(['smoker', 'non_smoker', 'outdoor_only', 'no_preference']).optional(),
        petPreference: z.enum(['has_pets', 'loves_pets', 'no_pets', 'no_preference']).optional(),
        genderPreference: z.enum(['male', 'female', 'any']).optional(),
        ageRangePreference: z.object({
            min: z.number().int().min(18),
            max: z.number().int().max(100),
        }).optional(),
    }).optional(),
    interests: z.array(z.string().transform(sanitizeString)).optional(),
    languages: z.array(z.string().transform(sanitizeString)).optional(),
});

export default {
    cnicSchema,
    phoneSchema,
    passwordSchema,
    emailSchema,
    coordinatesSchema,
    rentSchema,
    propertySizeSchema,
    paginationSchema,
    userRegistrationSchema,
    userLoginSchema,
    propertyCreateSchema,
    bookingRequestSchema,
    roommateProfileSchema,
    isValidCnic,
    isValidPhone,
    isValidPassword,
    isValidEmail,
    isValidCoordinates,
    isValidObjectId,
    sanitizeString,
};
