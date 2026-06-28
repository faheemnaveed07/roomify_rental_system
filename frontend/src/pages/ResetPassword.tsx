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

const passwordInputCls = 'dv-input !pr-10 text-sm';

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
            <div className="domavi-dark dv-page min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border-light)] notch-corner p-10 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-[#e05a4a]/15 border border-[#e05a4a]/40 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="h-8 w-8 text-[#e05a4a]" />
                    </div>
                    <h2 className="font-display text-3xl text-[var(--fg)] mb-2">Invalid Reset Link</h2>
                    <p className="text-sm text-[var(--muted)] mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-heading text-xs tracking-[0.2em] uppercase py-3 px-6 transition-colors"
                    >
                        Request New Link
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="domavi-dark dv-page min-h-screen flex items-center justify-center px-4 pt-28 pb-12 relative overflow-hidden">
            <div className="grain" aria-hidden />
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#d4845a]/10 blur-3xl" />
                <div className="absolute -right-32 -bottom-32 h-[32rem] w-[32rem] rounded-full bg-[#2d8f5e]/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-[var(--bg-card)] border border-[var(--border-light)] notch-corner p-8 md:p-10">
                    <Link
                        to="/auth"
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--fg)] mb-8"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Sign In
                    </Link>

                    <AnimatePresence mode="wait">
                        {!done ? (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="mb-8">
                                    <div className="w-12 h-12 border border-[var(--border-light)] flex items-center justify-center mb-4">
                                        <Lock className="h-5 w-5 text-[var(--accent)]" />
                                    </div>
                                    <h1 className="font-display text-4xl text-[var(--fg)] mb-1">Set new password</h1>
                                    <p className="text-sm text-[var(--muted)]">Choose a strong password you haven't used before.</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPw ? 'text' : 'password'}
                                                placeholder="Min. 8 chars, uppercase & number"
                                                autoComplete="new-password"
                                                className={passwordInputCls}
                                                {...register('password')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)]"
                                                aria-label={showPw ? 'Hide password' : 'Show password'}
                                            >
                                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[11px] text-[#e05a4a]">{errors.password.message}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                placeholder="Re-enter your password"
                                                autoComplete="new-password"
                                                className={passwordInputCls}
                                                {...register('confirm')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)]"
                                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.confirm && <p className="text-[11px] text-[#e05a4a]">{errors.confirm.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] disabled:opacity-60 text-black font-heading text-xs tracking-[0.2em] uppercase py-3.5 transition-colors"
                                    >
                                        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Reset Password'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-[#1d5a3b]/30 border border-[var(--verify-dim)] flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 className="h-8 w-8 text-[var(--verify-bright)]" />
                                </div>
                                <h2 className="font-display text-3xl text-[var(--fg)] mb-2">Password updated!</h2>
                                <p className="text-sm text-[var(--muted)]">Your password has been reset. Redirecting you to sign in…</p>
                                <div className="mt-4 flex justify-center">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
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
