import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

type State = 'loading' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [state, setState] = useState<State>('loading');
    const { verifyEmail } = useAuthStore();
    const calledRef = useRef(false);

    useEffect(() => {
        // Strict-mode guard — only run once
        if (calledRef.current) return;
        calledRef.current = true;

        if (!token) {
            setState('error');
            return;
        }

        verifyEmail(token)
            .then(() => {
                setState('success');
                toast.success('Email verified! You can now sign in.');
            })
            .catch(() => {
                setState('error');
            });
    }, [token, verifyEmail]);

    const content: Record<State, React.ReactNode> = {
        loading: (
            <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
            >
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-slate-600 text-sm font-medium">Verifying your email address…</p>
            </motion.div>
        ),
        success: (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex flex-col items-center gap-5"
            >
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Email verified!</h1>
                    <p className="text-sm text-slate-500">
                        Your account is now active. You can sign in and start exploring.
                    </p>
                </div>
                <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
                >
                    Sign In to Roomify
                </Link>
            </motion.div>
        ),
        error: (
            <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex flex-col items-center gap-5"
            >
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification failed</h1>
                    <p className="text-sm text-slate-500 mb-1">
                        This verification link is invalid or has expired.
                    </p>
                    <p className="text-xs text-slate-400">
                        Links expire after 24 hours. Please register again to receive a new link.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/auth"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </motion.div>
        ),
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
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 p-10 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600 mb-8">Roomify</p>
                    <AnimatePresence mode="wait">{content[state]}</AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
