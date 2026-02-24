import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { UserRole } from '@shared/types';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: UserRole.TENANT,
    });

    const { login, register, loading, error, user } = useAuthStore();
    const navigate = useNavigate();
    const resolveRedirect = (role?: string) => {
        if (role === UserRole.ADMIN) return '/admin';
        if (role === UserRole.LANDLORD) return '/dashboard';
        return '/browse';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login({ email: formData.email, password: formData.password });
            } else {
                await register(formData);
            }
            const nextRole = useAuthStore.getState().user?.role || user?.role || formData.role;
            navigate(resolveRedirect(nextRole), { replace: true });
        } catch (err) {
            console.error('Auth error:', err);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50">
            <div className="absolute inset-0 pointer-events-none">
                <svg
                    className="absolute -left-24 top-10 w-[28rem] opacity-70"
                    viewBox="0 0 520 520"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <defs>
                        <radialGradient id="authGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#DBEAFE" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>
                    <circle cx="260" cy="260" r="220" fill="url(#authGlow)" />
                </svg>
                <svg
                    className="absolute -right-20 bottom-0 w-[32rem] opacity-80"
                    viewBox="0 0 640 360"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="authWave" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FEF3C7" />
                            <stop offset="100%" stopColor="#DBEAFE" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0 120C120 70 240 40 320 60C440 100 520 200 640 200V360H0V120Z"
                        fill="url(#authWave)"
                    />
                </svg>
            </div>

            <div className="container relative z-10 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="hidden lg:block space-y-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Roomify Access</p>
                        <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-tight">
                            A premium rental experience
                            <span className="block text-primary-600">tailored for Multan.</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-xl">
                            Verify listings, manage requests, and move with confidence. Everything you need is one click away.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                                <p className="text-sm font-semibold text-slate-500">Verified Listings</p>
                                <p className="text-2xl font-extrabold text-slate-900">3,200+</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                                <p className="text-sm font-semibold text-slate-500">Active Landlords</p>
                                <p className="text-2xl font-extrabold text-slate-900">450+</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/95 rounded-3xl shadow-2xl border border-slate-200 p-8 md:p-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-slate-500 mb-8">
                            {isLogin
                                ? 'Enter your credentials to access your account'
                                : 'Join Roomify and start your search'}
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {!isLogin && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="First Name"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <Input
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}

                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />

                            {!isLogin && (
                                <Input
                                    label="Phone Number"
                                    name="phone"
                                    placeholder="03001234567"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            )}

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />

                            {!isLogin && (
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                                        I want to join as a
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange as any}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none bg-white"
                                    >
                                        <option value={UserRole.TENANT}>Tenant (looking for a place)</option>
                                        <option value={UserRole.LANDLORD}>Landlord (offering a place)</option>
                                    </select>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-3 text-lg font-semibold"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-slate-600">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="ml-2 font-semibold text-primary-600 hover:text-primary-700"
                                >
                                    {isLogin ? 'Create one now' : 'Sign in here'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
