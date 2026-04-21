import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse, IUserRegistration } from '@shared/types';
import { authService } from '../services/api';

interface AuthState {
    user: AuthResponse['user'] | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    setAuth: (response: AuthResponse) => void;
    clearAuth: () => void;
    validateSession: () => Promise<void>;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    register: (userData: IUserRegistration) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<string>;
    resetPassword: (token: string, password: string) => Promise<string>;
    verifyEmail: (token: string) => Promise<string>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            setAuth: (response) => {
                // ✅ No localStorage — tokens are in httpOnly cookies
                set({
                    user: response.user,
                    isAuthenticated: true,
                    error: null,
                });
            },
            clearAuth: () => {
                // ✅ No localStorage — cookies cleared by server
                set({
                    user: null,
                    isAuthenticated: false,
                    error: null,
                });
            },
            validateSession: async () => {
                // Called once on app boot - verifies the httpOnly cookie with the server
                try {
                    const user = await authService.getMe();
                    set({ user, isAuthenticated: true });
                } catch {
                    // Token invalid / expired / DB wiped — clear stale state
                    set({ user: null, isAuthenticated: false });
                }
            },
            login: async (credentials) => {
                set({ loading: true, error: null });
                try {
                    const response = await authService.login(credentials);
                    // ✅ Tokens are in httpOnly cookies, only set user in store
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        loading: false,
                    });
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Login failed';
                    set({ error: msg, loading: false });
                    throw error;
                }
            },
            register: async (userData) => {
                set({ loading: true, error: null });
                try {
                    const response = await authService.register(userData);
                    // ✅ Tokens are in httpOnly cookies, only set user in store
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        loading: false,
                    });
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Registration failed';
                    set({ error: msg, loading: false });
                    throw error;
                }
            },
            logout: async () => {
                try {
                    await authService.logout();
                } finally {
                    // ✅ Tokens cleared by server via cookies
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null,
                    });
                }
            },
            forgotPassword: async (email) => {
                set({ loading: true, error: null });
                try {
                    const msg = await authService.forgotPassword(email);
                    set({ loading: false });
                    return msg;
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Request failed';
                    set({ error: msg, loading: false });
                    throw error;
                }
            },
            resetPassword: async (token, password) => {
                set({ loading: true, error: null });
                try {
                    const msg = await authService.resetPassword(token, password);
                    set({ loading: false });
                    return msg;
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Reset failed';
                    set({ error: msg, loading: false });
                    throw error;
                }
            },
            verifyEmail: async (token) => {
                set({ loading: true, error: null });
                try {
                    const msg = await authService.verifyEmail(token);
                    set({ loading: false });
                    return msg;
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Verification failed';
                    set({ error: msg, loading: false });
                    throw error;
                }
            },
        }),
        {
            name: 'auth-storage',
            // ✅ Only persist user data, NOT tokens (tokens are in httpOnly cookies)
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
