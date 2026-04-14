import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const schema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Must contain at least one number'),
        confirm: z.string().min(1, 'Please confirm your password'),
    })
    .refine((d) => d.password === d.confirm, {
        message: 'Passwords do not match',
        path: ['confirm'],
    });

type FormValues = z.infer<typeof schema>;

const inputCls =
    'w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const navigate = useNavigate();

    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [done, setDone] = useState(false);

    const { resetPassword, loading } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormValues) => {
        if (!token) {
            toast.error('Invalid or missing reset token. Please request a new link.');
            return;
        }
        try {
            await resetPassword(token, data.password);
            setDone(true);
            setTimeout(() => navigate('/auth', { replace: true }), 2500);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.');
        }
    };

    // No token present → show error state immediately
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 p-10 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Reset Link</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
                    >
                        Request New Link
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-100/60 blur-3xl" />
                <div className="absolute -right-32 -bottom-32 h-[32rem] w-[32rem] rounded-full bg-amber-100/60 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 p-8 md:p-10">
                    <Link
                        to="/auth"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-8"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Sign In
                    </Link>

                    <AnimatePresence mode="wait">
                        {!done ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                                        <Lock className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Set new password</h1>
                                    <p className="text-sm text-slate-500">
                                        Choose a strong password you haven't used before.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type={showPw ? 'text' : 'password'}
                                                placeholder="Min. 8 chars, uppercase & number"
                                                autoComplete="new-password"
                                                className={inputCls}
                                                {...register('password')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                aria-label={showPw ? 'Hide password' : 'Show password'}
                                            >
                                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-xs text-red-500">{errors.password.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                placeholder="Re-enter your password"
                                                autoComplete="new-password"
                                                className={inputCls}
                                                {...register('confirm')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.confirm && (
                                            <p className="text-xs text-red-500">{errors.confirm.message}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                                    >
                                        {loading ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="text-center py-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Password updated!</h2>
                                <p className="text-sm text-slate-500">
                                    Your password has been reset. Redirecting you to sign in…
                                </p>
                                <div className="mt-4 flex justify-center">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
