import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

    const { login, register, loading, error } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/search';

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
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Auth error:', err);
        }
    };

    return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl shadow-xl border border-neutral-100">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-neutral-500 mb-8">
                {isLogin
                    ? 'Enter your credentials to access your account'
                    : 'Join Roomify and start your search'}
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-gap-y-6">
                {!isLogin && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
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

                <div className="mb-4">
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {!isLogin && (
                    <div className="mb-4">
                        <Input
                            label="Phone Number"
                            name="phone"
                            placeholder="03001234567"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                )}

                <div className="mb-6">
                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {!isLogin && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            I want to join as a
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange as any}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
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

            <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                <p className="text-neutral-600">
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
    );
};

export default AuthPage;
