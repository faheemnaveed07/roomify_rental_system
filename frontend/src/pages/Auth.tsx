import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, User, Phone, ArrowRight, Building2, Users } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '@shared/types';

// ─── Zod schemas ────────────────────────────────────────────────────
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^(\+92|0)?3[0-9]{9}$/, 'Enter a valid Pakistani phone number (e.g. 03001234567)'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    role: z.enum([UserRole.TENANT, UserRole.LANDLORD]),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Reusable field wrapper ──────────────────────────────────────────
function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--muted)]">{label}</label>
            {children}
            {error && <p className="text-[11px] text-[#e05a4a] mt-0.5">{error}</p>}
        </div>
    );
}

const inputCls = 'dv-input !pl-10 text-sm';
const passwordInputCls = 'dv-input !pr-10 text-sm';

// ─── Main page ───────────────────────────────────────────────────────
const AuthPage: React.FC = () => {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);

    const { login, register, loading } = useAuthStore();
    const navigate = useNavigate();

    const resolveRedirect = (role?: string) => {
        if (role === UserRole.ADMIN) return '/admin';
        if (role === UserRole.LANDLORD) return '/dashboard';
        return '/browse';
    };

    // ── Login form ──────────────────────────────────────────────────
    const {
        register: regLogin,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
    } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

    const onLogin = async (data: LoginFormValues) => {
        try {
            await login({ email: data.email, password: data.password });
            const role = useAuthStore.getState().user?.role;
            toast.success('Welcome back!');
            navigate(resolveRedirect(role), { replace: true });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Login failed. Please try again.');
        }
    };

    // ── Register form ───────────────────────────────────────────────
    const {
        register: regRegister,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: regErrors },
        watch: watchReg,
        setValue: setRegValue,
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: UserRole.TENANT },
    });

    const selectedRole = watchReg('role');

    const onRegister = async (data: RegisterFormValues) => {
        try {
            await register(data);
            toast.success('Account created! Please check your email to verify your address.', {
                duration: 6000,
            });
            navigate(resolveRedirect(data.role), { replace: true });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        }
    };

    // ── Tab animation variants ──────────────────────────────────────
    const variants = {
        enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
    };
    const direction = tab === 'register' ? 1 : -1;

    return (
        <div className="domavi-dark dv-page min-h-screen relative overflow-hidden pt-28 pb-16">
            <div className="grain" aria-hidden />
            {/* Decorative accent glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#d4845a]/10 blur-3xl" />
                <div className="absolute -right-32 -bottom-32 h-[32rem] w-[32rem] rounded-full bg-[#2d8f5e]/10 blur-3xl" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10 py-8 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* ── Hero panel ── */}
                    <div className="hidden lg:flex flex-col space-y-8">
                        <div>
                            <div className="section-marker mb-5">
                                <span>DOMAVI ACCESS</span>
                            </div>
                            <h1 className="font-display text-7xl leading-[0.9] text-[var(--fg)]">
                                A home you can <span className="text-[var(--accent)]">trust</span>
                                <br />
                                <span className="text-stroke">People you'll click with</span>
                            </h1>
                            <p className="mt-5 text-lg text-[var(--fg-dim)] max-w-md leading-relaxed">
                                Every member CNIC-verified. Real listings, secure agreements, and roommate matching — built for Multan.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Verified Members', value: '2,340' },
                                { label: 'Active Listings', value: '847' },
                                { label: 'Roommates Matched', value: '612' },
                                { label: 'Avg. Verify Time', value: '2 min' },
                            ].map((stat) => (
                                <div key={stat.label} className="info-card notch-corner p-5">
                                    <p className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-[0.18em]">{stat.label}</p>
                                    <p className="mt-1.5 font-display text-4xl text-[var(--fg)]">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 text-[var(--muted)] text-sm">
                            <div className="flex -space-x-2">
                                {['dav1', 'dav2', 'dav3', 'dav4'].map((s) => (
                                    <img key={s} src={`https://picsum.photos/seed/${s}/64/64`} className="h-8 w-8 rounded-full border-2 border-[var(--bg)] object-cover img-noir" alt="" />
                                ))}
                            </div>
                            <span className="font-mono text-[11px] tracking-wide">Trusted by 2,340+ verified members</span>
                        </div>
                    </div>

                    {/* ── Auth card ── */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-light)] notch-corner p-8 md:p-10 w-full max-w-md mx-auto lg:mx-0">

                        {/* Tab switcher */}
                        <div className="flex gap-1 bg-[var(--bg-darker)] border border-[var(--border)] p-1 mb-8">
                            {(['login', 'register'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTab(t)}
                                    className={`flex-1 py-2.5 font-heading text-xs tracking-[0.18em] uppercase transition-all ${
                                        tab === t ? 'bg-[var(--accent)] text-black' : 'text-[var(--fg-dim)] hover:text-[var(--fg)]'
                                    }`}
                                >
                                    {t === 'login' ? 'Sign In' : 'Create Account'}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait" custom={direction}>
                            {tab === 'login' ? (
                                <motion.div
                                    key="login"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                                >
                                    <h2 className="font-display text-4xl text-[var(--fg)] mb-1">Welcome back</h2>
                                    <p className="text-sm text-[var(--muted)] mb-7">Enter your credentials to continue</p>

                                    <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5" noValidate>
                                        <Field label="Email Address" error={loginErrors.email?.message}>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                                <input
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    autoComplete="email"
                                                    className={inputCls}
                                                    {...regLogin('email')}
                                                />
                                            </div>
                                        </Field>

                                        <Field label="Password" error={loginErrors.password?.message}>
                                            <div className="relative">
                                                <input
                                                    type={showLoginPw ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    autoComplete="current-password"
                                                    className={passwordInputCls}
                                                    {...regLogin('password')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLoginPw((v) => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)]"
                                                    aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                                                >
                                                    {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </Field>

                                        <div className="flex justify-end">
                                            <Link to="/forgot-password" className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-bright)]">
                                                Forgot your password?
                                            </Link>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] disabled:opacity-60 text-black font-heading text-xs tracking-[0.2em] uppercase py-3.5 transition-colors"
                                        >
                                            {loading ? (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                            ) : (
                                                <>
                                                    Sign In <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="register"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                                >
                                    <h2 className="font-display text-4xl text-[var(--fg)] mb-1">Create your account</h2>
                                    <p className="text-sm text-[var(--muted)] mb-7">Join thousands of verified renters and landlords</p>

                                    <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4" noValidate>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="First Name" error={regErrors.firstName?.message}>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                                    <input
                                                        type="text"
                                                        placeholder="Ali"
                                                        autoComplete="given-name"
                                                        className={inputCls}
                                                        {...regRegister('firstName')}
                                                    />
                                                </div>
                                            </Field>
                                            <Field label="Last Name" error={regErrors.lastName?.message}>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                                    <input
                                                        type="text"
                                                        placeholder="Khan"
                                                        autoComplete="family-name"
                                                        className={inputCls}
                                                        {...regRegister('lastName')}
                                                    />
                                                </div>
                                            </Field>
                                        </div>

                                        <Field label="Email Address" error={regErrors.email?.message}>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                                <input
                                                    type="email"
                                                    placeholder="ali@example.com"
                                                    autoComplete="email"
                                                    className={inputCls}
                                                    {...regRegister('email')}
                                                />
                                            </div>
                                        </Field>

                                        <Field label="Phone Number" error={regErrors.phone?.message}>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                                <input
                                                    type="tel"
                                                    placeholder="03001234567"
                                                    autoComplete="tel"
                                                    className={inputCls}
                                                    {...regRegister('phone')}
                                                />
                                            </div>
                                        </Field>

                                        <Field label="Password" error={regErrors.password?.message}>
                                            <div className="relative">
                                                <input
                                                    type={showRegPw ? 'text' : 'password'}
                                                    placeholder="Min. 8 chars, uppercase & number"
                                                    autoComplete="new-password"
                                                    className={passwordInputCls}
                                                    {...regRegister('password')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegPw((v) => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)]"
                                                    aria-label={showRegPw ? 'Hide password' : 'Show password'}
                                                >
                                                    {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </Field>

                                        {/* Role selector */}
                                        <div>
                                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">I am a…</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: UserRole.TENANT, label: 'Tenant', desc: 'Looking for a place', Icon: Users },
                                                    { value: UserRole.LANDLORD, label: 'Landlord', desc: 'Offering a place', Icon: Building2 },
                                                ].map(({ value, label, desc, Icon }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setRegValue('role', value as UserRole.TENANT | UserRole.LANDLORD)}
                                                        className={`flex flex-col items-center gap-1.5 border p-3 text-center transition-all ${
                                                            selectedRole === value
                                                                ? 'border-[var(--accent)] bg-[#d4845a]/10 text-[var(--accent-bright)]'
                                                                : 'border-[var(--border-light)] text-[var(--fg-dim)] hover:border-[var(--silver-dim)]'
                                                        }`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                        <span className="font-heading text-xs tracking-wider uppercase">{label}</span>
                                                        <span className="text-[10px] opacity-75">{desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {regErrors.role && <p className="text-[11px] text-[#e05a4a] mt-1">{regErrors.role.message}</p>}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-bright)] disabled:opacity-60 text-black font-heading text-xs tracking-[0.2em] uppercase py-3.5 transition-colors"
                                        >
                                            {loading ? (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                            ) : (
                                                <>
                                                    Create Account <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
                            By continuing you agree to our{' '}
                            <Link to="/terms" className="underline hover:text-[var(--fg-dim)]">Terms</Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="underline hover:text-[var(--fg-dim)]">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
