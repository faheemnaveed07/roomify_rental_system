import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/auth.store';
import AuthPage from './pages/Auth';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import VerifyEmailPage from './pages/VerifyEmail';
import HomePage from '@pages/Home';
import SearchPage from './pages/Search';
import PropertyDetailPage from './pages/PropertyDetail';
import AdminDashboardPage from './pages/AdminDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import AddPropertyPage from './pages/AddProperty';
import MyBookingsPage from './pages/MyBookings';
import MessagesPage from './pages/Messages';
import PaymentsPage from './pages/Payments';
import RoommateProfilePage from './pages/RoommateProfile';
import RoommateMatchesPage from './pages/RoommateMatches';
import DashboardLayout from './components/organisms/DashboardLayout';
import ProtectedRoute from './components/organisms/ProtectedRoute';
import RoleProtectedRoute from './components/atoms/RoleProtectedRoute';
import { UserRole } from '@shared/types';
import Header from './components/organisms/Header';
import AdminLayout from './components/organisms/AdminLayout';
import AdminUsersPage from './pages/AdminUsers';
import AdminAnalyticsPage from './pages/AdminAnalytics';
import AdminPaymentsPage from './pages/AdminPayments';
import PaymentSubmitPage from './pages/PaymentSubmit';
import AgreementPage from './pages/Agreement';
import VerificationPage from './pages/Verification';

// ── Footers ─────────────────────────────────────────────────────────
// The full marketing footer (brand pitch + quick links, including
// "Sign In / Register") belongs on marketing surfaces. Inside the app it is
// noise at best and wrong at worst — a logged-in tenant being offered
// "Sign In / Register" under their own payments page.
const FullFooter: React.FC = () => {
    // Live local clock for the meta row ("Pakistan → 11:27 am")
    const [clock, setClock] = useState('');
    useEffect(() => {
        const fmt = () =>
            new Date()
                .toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Karachi',
                })
                .toLowerCase();
        setClock(fmt());
        const id = setInterval(() => setClock(fmt()), 30_000);
        return () => clearInterval(id);
    }, []);

    const columns: { label: string; links: { text: string; to: string }[] }[] = [
        {
            label: 'Navigation',
            links: [
                { text: 'Verification', to: '#verification' },
                { text: 'Browse', to: '#browse' },
                { text: 'Matching', to: '#matching' },
                { text: 'Safety', to: '#trust' },
                { text: 'Stories', to: '#stories' },
            ],
        },
        {
            label: 'Account',
            links: [
                { text: 'Sign In', to: '/auth' },
                { text: 'Sign Up', to: '/auth?tab=register' },
                { text: 'Get Verified', to: '/verify' },
            ],
        },
        {
            label: 'Contact',
            links: [
                { text: 'support@propertyrentalsystem.pk', to: 'mailto:support@propertyrentalsystem.pk' },
                { text: 'WhatsApp', to: 'https://wa.me/920000000000' },
            ],
        },
    ];

    return (
        <footer className="domavi-dark bg-black rounded-t-[2.5rem] border-t border-[var(--border)] mt-20 overflow-hidden">
            {/* Link columns */}
            <div className="container pt-16 pb-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
                {columns.map((col) => (
                    <div key={col.label}>
                        <h4 className="font-mono text-[11px] tracking-[0.25em] uppercase text-[var(--muted)] mb-5">
                            {col.label}
                        </h4>
                        <ul className="space-y-3 text-[15px]">
                            {col.links.map((l) => (
                                <li key={l.text}>
                                    {l.to.startsWith('/') ? (
                                        <Link to={l.to} className="text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors">
                                            {l.text}
                                        </Link>
                                    ) : (
                                        <a href={l.to} className="text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors">
                                            {l.text}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Meta row */}
            <div className="container border-t border-[var(--border)] py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <span className="text-[var(--fg-dim)]">© 2026 Property Rental System. All rights reserved.</span>
                <span className="font-mono text-xs tracking-wide text-[var(--muted)]">Pakistan → {clock}</span>
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors"
                >
                    Back to top ↑
                </button>
            </div>

            {/* Giant wordmark, cropped at the bottom edge */}
            <div className="overflow-hidden select-none pointer-events-none" aria-hidden="true">
                <div className="font-display whitespace-nowrap text-center leading-none text-[11.5vw] tracking-wide text-[var(--fg)] translate-y-[22%]">
                    PROPERTY RENTAL SYSTEM
                </div>
            </div>
        </footer>
    );
};

// One quiet line for content pages: keeps the page grounded without pitching
// the product to someone who is already using it.
const SlimFooter: React.FC = () => (
    <footer className="domavi-dark bg-[var(--bg-darker)] border-t border-[var(--border)] py-6 mt-16">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] tracking-[0.15em] text-[var(--muted)]">
            <span>© 2026 PROPERTY RENTAL SYSTEM</span>
            <span>support@propertyrentalsystem.pk</span>
        </div>
    </footer>
);

// ── Public layout: Header + main content + route-aware footer ──────
// Three tiers, the way large rental platforms do it:
//   full — marketing surfaces (the landing page)
//   slim — content/discovery pages (browse, detail, matches, auth family, 404)
//   none — focused task flows (chat, payments, bookings, wizard, verification),
//          where a footer under the work area is checkout-pattern noise
const NO_FOOTER_EXACT = ['/messages', '/my-bookings', '/payments', '/verify', '/roommate-profile'];
const NO_FOOTER_PREFIX = ['/payment/submit', '/agreement/'];

const PublicLayout: React.FC = () => {
    const { pathname } = useLocation();

    const footer =
        pathname === '/' ? <FullFooter />
        : NO_FOOTER_EXACT.includes(pathname) ||
          NO_FOOTER_PREFIX.some((p) => pathname.startsWith(p)) ? null
        : <SlimFooter />;

    return (
        <div className="dv-app min-h-screen bg-neutral-50 flex flex-col">
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            {footer}
        </div>
    );
};

const App: React.FC = () => {
    const { isAuthenticated, validateSession } = useAuthStore();

    // On every app boot, verify the persisted session against the server.
    // If the cookie is gone or the DB was wiped the stale state is cleared.
    useEffect(() => {
        if (isAuthenticated) {
            validateSession();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
    <Router>
        <Routes>
            {/* ── Landlord dashboard — full-screen layout, no public Header ── */}
            <Route element={<RoleProtectedRoute allowedRoles={[UserRole.LANDLORD]} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<LandlordDashboard />} />
                    <Route path="requests" element={<LandlordDashboard />} />
                    <Route path="properties" element={<LandlordDashboard />} />
                    <Route path="agreements" element={<LandlordDashboard />} />
                </Route>
                <Route path="/add-property" element={<DashboardLayout />}>
                    <Route index element={<AddPropertyPage />} />
                </Route>
            </Route>

            {/* ── Admin panel — full-screen layout, no public Header ── */}
            <Route element={<RoleProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="analytics" element={<AdminAnalyticsPage />} />
                    <Route path="payments" element={<AdminPaymentsPage />} />
                    <Route path="properties" element={<AdminDashboardPage />} />
                </Route>
            </Route>

            {/* ── Public + tenant routes — shared Header + footer ── */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/search" element={<Navigate to="/browse" replace />} />
                <Route path="/browse" element={
                    <ProtectedRoute>
                        <SearchPage />
                    </ProtectedRoute>
                } />
                <Route path="/property/:id" element={
                    <ProtectedRoute>
                        <PropertyDetailPage />
                    </ProtectedRoute>
                } />
                <Route path="/verify" element={
                    <ProtectedRoute>
                        <VerificationPage />
                    </ProtectedRoute>
                } />
                <Route path="/my-bookings" element={
                    <ProtectedRoute>
                        <MyBookingsPage />
                    </ProtectedRoute>
                } />
                <Route path="/messages" element={
                    <ProtectedRoute>
                        <MessagesPage />
                    </ProtectedRoute>
                } />
                <Route path="/payments" element={
                    <ProtectedRoute>
                        <PaymentsPage />
                    </ProtectedRoute>
                } />
                <Route path="/payment/submit/:bookingId" element={
                    <ProtectedRoute>
                        <PaymentSubmitPage />
                    </ProtectedRoute>
                } />
                <Route path="/agreement/:bookingId" element={
                    <ProtectedRoute>
                        <AgreementPage />
                    </ProtectedRoute>
                } />
                <Route path="/roommate-profile" element={
                    <ProtectedRoute>
                        <RoommateProfilePage />
                    </ProtectedRoute>
                } />
                <Route path="/roommate-matches" element={
                    <ProtectedRoute>
                        <RoommateMatchesPage />
                    </ProtectedRoute>
                } />
                <Route path="*" element={
                    <div className="container py-20 text-center">
                        <h1 className="text-6xl font-bold text-neutral-200 mb-4">404</h1>
                        <p className="text-xl text-neutral-500">Page not found</p>
                        <Link to="/" className="mt-8 inline-block text-primary-600 font-bold underline">Go back home</Link>
                    </div>
                } />
            </Route>
        </Routes>
        <Toaster richColors position="top-right" />
    </Router>
    );
};

export default App;
