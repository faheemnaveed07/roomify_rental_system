import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse } from '@shared/types';
import { authService } from '../services/api';

interface AuthState {
    user: AuthResponse['user'] | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    setAuth: (response: AuthResponse) => void;
    clearAuth: () => void;
    login: (credentials: any) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            setAuth: (response) => {
                localStorage.setItem('token', response.tokens.accessToken);
                set({
                    user: response.user,
                    token: response.tokens.accessToken,
                    isAuthenticated: true,
                    error: null,
                });
            },
            clearAuth: () => {
                localStorage.removeItem('token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                });
            },
            login: async (credentials) => {
                set({ loading: true, error: null });
                try {
                    const response = await authService.login(credentials);
                    localStorage.setItem('token', response.tokens.accessToken);
                    set({
                        user: response.user,
                        token: response.tokens.accessToken,
                        isAuthenticated: true,
                        loading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },
            register: async (userData) => {
                set({ loading: true, error: null });
                try {
                    const response = await authService.register(userData);
                    localStorage.setItem('token', response.tokens.accessToken);
                    set({
                        user: response.user,
                        token: response.tokens.accessToken,
                        isAuthenticated: true,
                        loading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },
            logout: async () => {
                try {
                    await authService.logout();
                } finally {
                    localStorage.removeItem('token');
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
