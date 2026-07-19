import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
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

// ── Public layout: Header + main content + footer ──────────────────
const PublicLayout: React.FC = () => (
    <div className="dv-app min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <main className="flex-grow">
            <Outlet />
        </main>
        <footer className="domavi-dark bg-[var(--bg-darker)] border-t border-[var(--border)] text-[var(--fg-dim)] py-16 mt-20">
            <div className="container grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 bg-[var(--accent)] flex items-center justify-center shrink-0">
                            <span className="text-black font-display text-lg leading-none">D</span>
                        </span>
                        <span>
                            <span className="block font-display text-2xl leading-none tracking-wider text-[var(--fg)]">DOMAVI</span>
                            <span className="block font-mono text-[9px] text-[var(--muted)] tracking-[0.3em] mt-0.5">TRUST · HOME · <span className="font-urdu">گھر</span></span>
                        </span>
                    </div>
                    <p className="max-w-xs text-sm leading-relaxed">A home you can trust. People you'll click with — CNIC-verified rentals &amp; roommate matching for Pakistan.</p>
                </div>
                <div>
                    <h4 className="font-heading text-sm tracking-[0.2em] uppercase text-[var(--fg)] mb-4">Quick Links</h4>
                    <ul className="space-y-2.5 text-sm">
                        <li><Link to="/browse" className="hover:text-[var(--accent)] transition-colors">Find Properties</Link></li>
                        <li><Link to="/auth" className="hover:text-[var(--accent)] transition-colors">Sign In / Register</Link></li>
                        <li><Link to="/roommate-matches" className="hover:text-[var(--accent)] transition-colors">Roommate Matching</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-heading text-sm tracking-[0.2em] uppercase text-[var(--fg)] mb-4">Contact</h4>
                    <p className="font-mono text-xs tracking-wide">support@domavi.pk</p>
                    <p className="font-mono text-xs tracking-wide mt-1.5">MULTAN · PAKISTAN</p>
                </div>
            </div>
            <div className="container border-t border-[var(--border)] mt-12 pt-8 text-center font-mono text-xs tracking-[0.15em] text-[var(--muted)]">
                © 2026 DOMAVI RENTAL SYSTEM · BUILT FOR MULTAN
            </div>
        </footer>
    </div>
);

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
