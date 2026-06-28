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
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-[var(--accent)] animate-spin" />
                <p className="text-[var(--fg-dim)] text-sm font-medium">Verifying your email address…</p>
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
                <div className="w-20 h-20 rounded-full bg-[#1d5a3b]/30 border border-[var(--verify-dim)] flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-[var(--verify-bright)]" />
                </div>
                <div className="text-center">
                    <h1 className="font-display text-4xl text-[var(--fg)] mb-2">Email verified!</h1>
                    <p className="text-sm text-[var(--muted)]">Your account is now active. You can sign in and start exploring.</p>
                </div>
                <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-heading text-xs tracking-[0.2em] uppercase py-3 px-6 transition-colors"
                >
                    Sign In to Domavi
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
                <div className="w-20 h-20 rounded-full bg-[#e05a4a]/15 border border-[#e05a4a]/40 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-[#e05a4a]" />
                </div>
                <div className="text-center">
                    <h1 className="font-display text-4xl text-[var(--fg)] mb-2">Verification failed</h1>
                    <p className="text-sm text-[var(--muted)] mb-1">This verification link is invalid or has expired.</p>
                    <p className="text-xs text-[var(--muted)]">Links expire after 24 hours. Please register again to receive a new link.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/auth"
                        className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-heading text-xs tracking-[0.2em] uppercase py-3 px-5 transition-colors"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </motion.div>
        ),
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
                <div className="bg-[var(--bg-card)] border border-[var(--border-light)] notch-corner p-10 text-center">
                    <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[var(--accent)] mb-8">DOMAVI</p>
                    <AnimatePresence mode="wait">{content[state]}</AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
