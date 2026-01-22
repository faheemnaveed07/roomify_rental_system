export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    stack?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar: string | null;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface UploadResponse {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
}

export interface VerificationResponse {
    documentId: string;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
}

export interface BookingResponse {
    bookingId: string;
    status: string;
    property: {
        id: string;
        title: string;
    };
    tenant: {
        id: string;
        name: string;
    };
    landlord: {
        id: string;
        name: string;
    };
    rent: {
        monthly: number;
        total: number;
        currency: string;
    };
    moveInDate: Date;
    duration: {
        value: number;
        unit: string;
    };
}

export interface CompatibilityResponse {
    userId: string;
    matchedUserId: string;
    score: number;
    breakdown: {
        category: string;
        score: number;
        weight: number;
    }[];
}

export interface StatisticsResponse {
    totalProperties: number;
    activeListings: number;
    totalUsers: number;
    pendingVerifications: number;
    totalBookings: number;
    completedBookings: number;
}

export interface NotificationPayload {
    type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'message' | 'verification_update';
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export interface SearchSuggestion {
    type: 'city' | 'area' | 'property';
    value: string;
    label: string;
    count?: number;
}

export interface GeolocationResult {
    latitude: number;
    longitude: number;
    accuracy: number;
    city?: string;
    area?: string;
}
