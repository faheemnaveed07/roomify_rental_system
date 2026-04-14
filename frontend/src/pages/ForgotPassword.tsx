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

const inputCls =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

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
                        {!submitted ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                                        <Mail className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot your password?</h1>
                                    <p className="text-sm text-slate-500">
                                        No problem. Enter your email and we'll send you a reset link.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="email"
                                                placeholder="name@example.com"
                                                autoComplete="email"
                                                className={inputCls}
                                                {...register('email')}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-xs text-red-500">{errors.email.message}</p>
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
                                            'Send Reset Link'
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
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h2>
                                <p className="text-sm text-slate-500 mb-1">
                                    We've sent a password reset link to
                                </p>
                                <p className="text-sm font-semibold text-slate-800 mb-6">{submittedEmail}</p>
                                <p className="text-xs text-slate-400">
                                    Didn't receive it? Check your spam folder or{' '}
                                    <button
                                        type="button"
                                        onClick={() => setSubmitted(false)}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
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
