import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const schema = z.object({
    email: z.string().email('Please enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

const inputCls = 'dv-input !pl-10 text-sm';

const ForgotPasswordPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const { forgotPassword, loading } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormValues) => {
        try {
            await forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setSubmitted(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    };

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
                        {!submitted ? (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="mb-8">
                                    <div className="w-12 h-12 border border-[var(--border-light)] flex items-center justify-center mb-4">
                                        <Mail className="h-5 w-5 text-[var(--accent)]" />
                                    </div>
                                    <h1 className="font-display text-4xl text-[var(--fg)] mb-1">Forgot your password?</h1>
                                    <p className="text-sm text-[var(--muted)]">No problem. Enter your email and we'll send you a reset link.</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                            <input type="email" placeholder="name@example.com" autoComplete="email" className={inputCls} {...register('email')} />
                                        </div>
                                        {errors.email && <p className="text-[11px] text-[#e05a4a]">{errors.email.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] disabled:opacity-60 text-black font-heading text-xs tracking-[0.2em] uppercase py-3.5 transition-colors"
                                    >
                                        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Send Reset Link'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-[#1d5a3b]/30 border border-[var(--verify-dim)] flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 className="h-8 w-8 text-[var(--verify-bright)]" />
                                </div>
                                <h2 className="font-display text-3xl text-[var(--fg)] mb-2">Check your inbox</h2>
                                <p className="text-sm text-[var(--muted)] mb-1">We've sent a password reset link to</p>
                                <p className="text-sm font-semibold text-[var(--fg)] mb-6">{submittedEmail}</p>
                                <p className="text-xs text-[var(--muted)]">
                                    Didn't receive it? Check your spam folder or{' '}
                                    <button type="button" onClick={() => setSubmitted(false)} className="text-[var(--accent)] hover:underline font-medium">
                                        try again
                                    </button>
                                    .
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
