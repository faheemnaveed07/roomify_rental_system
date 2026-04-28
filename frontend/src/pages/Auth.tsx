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
        <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {children}
            {error && (
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
            )}
        </div>
    );
}

const inputCls =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

const passwordInputCls =
    'w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

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
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-100/60 blur-3xl" />
                <div className="absolute -right-32 -bottom-32 h-[32rem] w-[32rem] rounded-full bg-amber-100/60 blur-3xl" />
            </div>

            <div className="container relative z-10 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* ── Hero panel ── */}
                    <div className="hidden lg:flex flex-col space-y-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-600 mb-3">
                                Roomify Access
                            </p>
                            <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
                                A smarter way to{' '}
                                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                    rent in Multan
                                </span>
                            </h1>
                            <p className="mt-4 text-lg text-slate-500 max-w-md">
                                Verified listings, seamless agreements, and real-time messaging — all in one place.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Verified Listings', value: '3,200+' },
                                { label: 'Active Landlords', value: '450+' },
                                { label: 'Cities Covered', value: '8' },
                                { label: 'Avg. Response', value: '< 2 hrs' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm"
                                >
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        {stat.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <div className="flex -space-x-2">
                                {['bg-blue-400', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400'].map((c, i) => (
                                    <div
                                        key={i}
                                        className={`h-8 w-8 rounded-full border-2 border-white ${c}`}
                                    />
                                ))}
                            </div>
                            <span>Trusted by 12,000+ tenants &amp; landlords</span>
                        </div>
                    </div>

                    {/* ── Auth card ── */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 p-8 md:p-10">

                        {/* Tab switcher */}
                        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-8">
                            {(['login', 'register'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTab(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        tab === t
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
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
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
                                    <p className="text-sm text-slate-500 mb-7">
                                        Enter your credentials to continue
                                    </p>

                                    <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5" noValidate>
                                        <Field label="Email Address" error={loginErrors.email?.message}>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                    aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                                                >
                                                    {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </Field>

                                        <div className="flex justify-end">
                                            <Link
                                                to="/forgot-password"
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                                        >
                                            {loading ? (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
                                    <p className="text-sm text-slate-500 mb-7">
                                        Join thousands of renters and landlords
                                    </p>

                                    <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4" noValidate>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="First Name" error={regErrors.firstName?.message}>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                    aria-label={showRegPw ? 'Hide password' : 'Show password'}
                                                >
                                                    {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </Field>

                                        {/* Role selector */}
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 mb-2">I am a…</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: UserRole.TENANT, label: 'Tenant', desc: 'Looking for a place', Icon: Users },
                                                    { value: UserRole.LANDLORD, label: 'Landlord', desc: 'Offering a place', Icon: Building2 },
                                                ].map(({ value, label, desc, Icon }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setRegValue('role', value as UserRole.TENANT | UserRole.LANDLORD)}
                                                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                                                            selectedRole === value
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                        <span className="text-xs font-semibold">{label}</span>
                                                        <span className="text-[10px] opacity-75">{desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {regErrors.role && (
                                                <p className="text-xs text-red-500 mt-1">{regErrors.role.message}</p>
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
                                                <>
                                                    Create Account <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="mt-6 text-center text-xs text-slate-400">
                            By continuing you agree to our{' '}
                            <Link to="/terms" className="underline hover:text-slate-600">Terms</Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
