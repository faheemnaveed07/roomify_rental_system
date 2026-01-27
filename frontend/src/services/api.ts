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

export default api;
