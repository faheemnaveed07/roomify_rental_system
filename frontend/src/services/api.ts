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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const ASSETS_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse>) => {
        console.error('API Error:', {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response?.data,
        });
        const status = error.response?.status;

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Optional: window.location.href = '/auth';
        }

        const message = error.response?.data?.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

export const authService = {
    login: async (credentials: IUserLogin): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
        return response.data.data!;
    },
    register: async (userData: IUserRegistration): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
        return response.data.data!;
    },
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
