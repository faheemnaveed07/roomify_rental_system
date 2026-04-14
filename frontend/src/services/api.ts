import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
    ApiResponse,
    AuthResponse,
    IUserLogin,
    IUserRegistration,
    IProperty,
    IPropertySearchResult,
    IPropertyFilter,
    PaginationQuery,
    LandlordStatistics,
    IPropertyCreate
} from '@shared/types';
import { IRoommateProfileForm, IRoommateProfileResponse } from '../types/roommate.types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const ASSETS_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // ✅ Enable httpOnly cookies in requests
    withCredentials: true,
});

// ✅ Request interceptor — attach token from header for mobile apps (optional fallback)
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Cookies are automatically sent by browser, no need to manually attach
        // This is kept for backward compatibility with mobile apps
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Enhanced response interceptor for automatic token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse>) => {
        const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        console.error('API Error:', {
            message: error.message,
            status: error.response?.status,
            url: config?.url,
            method: config?.method,
            data: error.response?.data,
        });

        // ✅ If 401 and not already retrying, attempt refresh
        if (error.response?.status === 401 && !config?._retry) {
            config._retry = true;

            try {
                // Call refresh endpoint — cookies are automatically sent
                const refreshResponse = await api.post<ApiResponse<{ tokens: { accessToken: string } }>>('/auth/refresh-token');
                
                if (refreshResponse.data.success) {
                    // New cookies are automatically set by the server
                    // Retry the original request
                    return api(config);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Refresh failed — redirect to login
                // Cookies will be cleared by server
                window.location.href = '/auth';
            }
        }

        if (error.response?.status === 401) {
            // Final 401 — redirect to login
            window.location.href = '/auth';
        }

        const message = error.response?.data?.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

export const authService = {
    login: async (credentials: IUserLogin): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
        // ✅ Tokens are now in httpOnly cookies, not in response
        return response.data.data!;
    },
    register: async (userData: IUserRegistration): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
        // ✅ Tokens are now in httpOnly cookies, not in response
        return response.data.data!;
    },
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
        // ✅ Cookies are automatically cleared by server
    },
    forgotPassword: async (email: string): Promise<string> => {
        const response = await api.post<ApiResponse<never>>('/auth/forgot-password', { email });
        return response.data.message;
    },
    resetPassword: async (token: string, password: string): Promise<string> => {
        const response = await api.post<ApiResponse<never>>('/auth/reset-password', { token, password });
        return response.data.message;
    },
    verifyEmail: async (token: string): Promise<string> => {
        const response = await api.get<ApiResponse<never>>(`/auth/verify-email/${token}`);
        return response.data.message;
    },
};

export const propertyService = {
    getProperties: async (filters: IPropertyFilter = {}, pagination: PaginationQuery = {}): Promise<IPropertySearchResult> => {
        const response = await api.get<ApiResponse<IProperty[]>>('/properties/search', {
            params: { ...filters, ...pagination },
        });

        // Convert ApiResponse to IPropertySearchResult structure expected by the app
        return {
            properties: response.data.data || [],
            total: response.data.meta?.total || 0,
            page: response.data.meta?.page || 1,
            limit: response.data.meta?.limit || 10,
            totalPages: response.data.meta?.totalPages || 1,
        };
    },
    getById: async (id: string): Promise<IProperty> => {
        const response = await api.get<ApiResponse<IProperty>>(`/properties/${id}`);
        return response.data.data!;
    },
    create: async (propertyData: IPropertyCreate | (IPropertyCreate & { owner: string })): Promise<IProperty> => {
        const response = await api.post<ApiResponse<IProperty>>('/properties', propertyData);
        return response.data.data!;
    },
};

export const bookingService = {
    requestBooking: async (bookingData: any): Promise<any> => {
        const response = await api.post<ApiResponse<any>>('/bookings/request', bookingData);
        return response.data.data!;
    },
    updateStatus: async (bookingId: string, status: 'approved' | 'rejected', message?: string): Promise<any> => {
        const endpoint = status === 'approved' ? 'approve' : 'reject';
        const response = await api.post<ApiResponse<any>>(`/bookings/${bookingId}/${endpoint}`, { responseMessage: message });
        return response.data.data!;
    },
    getMyBookings: async (pagination: PaginationQuery = {}): Promise<any> => {
        const response = await api.get<ApiResponse<any>>('/bookings/my-bookings', { params: pagination });
        return response.data.data!;
    }
};

export const landlordService = {
    getStats: async (): Promise<LandlordStatistics> => {
        const response = await api.get<ApiResponse<LandlordStatistics>>('/landlord/stats');
        return response.data.data!;
    },
    getMyProperties: async (): Promise<IProperty[]> => {
        const response = await api.get<ApiResponse<IProperty[]>>('/landlord/properties');
        return response.data.data!;
    },
    getBookings: async (pagination: PaginationQuery = {}): Promise<any> => {
        // This will call the landlord-specific bookings view
        const response = await api.get<ApiResponse<any>>('/bookings/landlord', { params: pagination });
        return response.data.data!;
    }
};

// Chat Service
export const chatService = {
    getConversations: async (page = 1, limit = 20): Promise<any> => {
        const response = await api.get<ApiResponse<any>>('/chat/conversations', { params: { page, limit } });
        return response.data;
    },
    getConversation: async (conversationId: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>(`/chat/conversations/${conversationId}`);
        return response.data.data!;
    },
    getMessages: async (conversationId: string, page = 1, limit = 50): Promise<any> => {
        const response = await api.get<ApiResponse<any>>(`/chat/conversations/${conversationId}/messages`, { 
            params: { page, limit } 
        });
        return response.data;
    },
    sendMessage: async (data: { conversationId?: string; receiverId: string; propertyId?: string; content: string }): Promise<any> => {
        const response = await api.post<ApiResponse<any>>('/chat/messages', data);
        return response.data.data!;
    },
    markAsRead: async (conversationId: string): Promise<void> => {
        await api.post(`/chat/conversations/${conversationId}/read`);
    },
    getUnreadCount: async (): Promise<number> => {
        const response = await api.get<ApiResponse<{ unreadCount: number }>>('/chat/unread');
        return response.data.data?.unreadCount || 0;
    },
    startPropertyInquiry: async (landlordId: string, propertyId: string, message: string): Promise<any> => {
        const response = await api.post<ApiResponse<any>>('/chat/inquiry', { landlordId, propertyId, message });
        return response.data.data!;
    },
};

// Payment Service
export const paymentService = {
    // Bank accounts (landlord)
    getBankAccounts: async (): Promise<any[]> => {
        const response = await api.get<ApiResponse<any[]>>('/payments/bank-accounts');
        return response.data.data!;
    },
    addBankAccount: async (data: { bankName: string; accountTitle: string; accountNumber: string; iban?: string; branchCode?: string; isDefault?: boolean }): Promise<any> => {
        const response = await api.post<ApiResponse<any>>('/payments/bank-accounts', data);
        return response.data.data!;
    },
    updateBankAccount: async (accountId: string, data: any): Promise<any> => {
        const response = await api.put<ApiResponse<any>>(`/payments/bank-accounts/${accountId}`, data);
        return response.data.data!;
    },
    deleteBankAccount: async (accountId: string): Promise<void> => {
        await api.delete(`/payments/bank-accounts/${accountId}`);
    },

    // Payments
    createPayment: async (data: any): Promise<any> => {
        const response = await api.post<ApiResponse<any>>('/payments', data);
        return response.data.data!;
    },
    submitPaymentProof: async (paymentId: string, data: { transactionReference: string; proofOfPayment: string }): Promise<any> => {
        const response = await api.post<ApiResponse<any>>(`/payments/${paymentId}/proof`, data);
        return response.data.data!;
    },
    scheduleCashCollection: async (paymentId: string, data: { scheduledDate: string; location: string; notes?: string }): Promise<any> => {
        const response = await api.post<ApiResponse<any>>(`/payments/${paymentId}/schedule-cash`, data);
        return response.data.data!;
    },
    confirmPayment: async (paymentId: string, data: { confirmed: boolean; notes?: string; rejectionReason?: string }): Promise<any> => {
        const response = await api.post<ApiResponse<any>>(`/payments/${paymentId}/confirm`, data);
        return response.data.data!;
    },
    getPaymentById: async (paymentId: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>(`/payments/${paymentId}`);
        return response.data.data!;
    },
    getBookingPayments: async (bookingId: string): Promise<any[]> => {
        const response = await api.get<ApiResponse<any[]>>(`/payments/booking/${bookingId}`);
        return response.data.data!;
    },
    getTenantPayments: async (page = 1, limit = 20): Promise<any> => {
        const response = await api.get<ApiResponse<any>>('/payments/tenant', { params: { page, limit } });
        return response.data;
    },
    getLandlordPayments: async (page = 1, limit = 20, status?: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>('/payments/landlord', { params: { page, limit, status } });
        return response.data;
    },
    getLandlordPaymentStats: async (): Promise<any> => {
        const response = await api.get<ApiResponse<any>>('/payments/landlord/stats');
        return response.data.data!;
    },

    // NEW: combined submit with receipt file upload (multipart/form-data)
    submitPaymentWithReceipt: async (data: {
        bookingId: string;
        paymentType: string;
        paymentMethod: string;
        transactionReference: string;
        receiptFile: File;
    }): Promise<any> => {
        const formData = new FormData();
        formData.append('bookingId', data.bookingId);
        formData.append('paymentType', data.paymentType);
        formData.append('paymentMethod', data.paymentMethod);
        formData.append('transactionReference', data.transactionReference);
        formData.append('receipt', data.receiptFile);

        const response = await api.post<ApiResponse<any>>('/payments/submit-with-receipt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data!;
    },

    // Booking bank details for payment form
    getBookingById: async (bookingId: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>(`/bookings/${bookingId}`);
        return response.data.data!;
    },

    // Fetch landlord's bank accounts so tenant knows where to transfer
    getLandlordBankAccounts: async (landlordId: string): Promise<any[]> => {
        const response = await api.get<ApiResponse<any[]>>(`/payments/landlord/${landlordId}/bank-accounts`);
        return response.data.data || [];
    },
};

// Admin Payment Service (UPDATED)
export const adminPaymentService = {
    getAllPayments: async (page = 1, limit = 20, status?: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>('/admin/payments', {
            params: { page, limit, ...(status ? { status } : {}) },
        });
        return response.data;
    },
    approvePayment: async (paymentId: string, adminNotes?: string): Promise<any> => {
        const response = await api.put<ApiResponse<any>>(`/admin/payments/${paymentId}/approve`, { adminNotes });
        return response.data.data!;
    },
    rejectPayment: async (paymentId: string, reason: string): Promise<any> => {
        const response = await api.put<ApiResponse<any>>(`/admin/payments/${paymentId}/reject`, { reason });
        return response.data.data!;
    },
};

export const agreementService = {
    generate: async (bookingId: string): Promise<any> => {
        const response = await api.post<ApiResponse<any>>(`/agreements/generate/${bookingId}`);
        return response.data.data!;
    },
    getByBooking: async (bookingId: string): Promise<any> => {
        const response = await api.get<ApiResponse<any>>(`/agreements/booking/${bookingId}`);
        return response.data.data!;
    },
    download: async (agreementId: string): Promise<Blob> => {
        const response = await api.get(`/agreements/download/${agreementId}`, { responseType: 'blob' });
        return response.data as Blob;
    },
    sign: async (agreementId: string): Promise<any> => {
        const response = await api.put<ApiResponse<any>>(`/agreements/${agreementId}/sign`);
        return response.data.data!;
    },
};

// Matching / Recommendation Service
export const matchingService = {
    getMatchedProperties: async (
        filters: IPropertyFilter = {},
        pagination: PaginationQuery = {}
    ): Promise<{
        hasProfile: boolean;
        properties: IProperty[];
        scores: { propertyId: string; overallScore: number; breakdown: { category: string; score: number; weight: number; weightedScore: number }[] }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> => {
        const response = await api.get<ApiResponse<any>>('/matching/properties', {
            params: { ...filters, ...pagination },
        });
        return response.data.data!;
    },
    getPropertyScore: async (
        propertyId: string
    ): Promise<{
        hasProfile: boolean;
        score: { propertyId: string; overallScore: number; breakdown: { category: string; score: number; weight: number; weightedScore: number }[] } | null;
    }> => {
        const response = await api.get<ApiResponse<any>>(`/matching/property/${propertyId}`);
        return response.data.data!;
    },
};

export default api;

// ─── Roommate Profile Service ─────────────────────────────────────────────────
export const roommateProfileService = {
    getProfile: async (): Promise<IRoommateProfileResponse | null> => {
        try {
            const response = await api.get<ApiResponse<IRoommateProfileResponse>>('/roommate-profile');
            return response.data.data ?? null;
        } catch {
            return null;
        }
    },
    createProfile: async (data: IRoommateProfileForm): Promise<IRoommateProfileResponse> => {
        const response = await api.post<ApiResponse<IRoommateProfileResponse>>('/roommate-profile', data);
        return response.data.data!;
    },
    updateProfile: async (data: Partial<IRoommateProfileForm>): Promise<IRoommateProfileResponse> => {
        const response = await api.put<ApiResponse<IRoommateProfileResponse>>('/roommate-profile', data);
        return response.data.data!;
    },
};
