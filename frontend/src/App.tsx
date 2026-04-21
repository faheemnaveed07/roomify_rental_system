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

// ── Public layout: Header + main content + footer ──────────────────
const PublicLayout: React.FC = () => (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <main className="flex-grow">
            <Outlet />
        </main>
        <footer className="bg-neutral-900 text-neutral-400 py-12 mt-20">
            <div className="container grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                    <h3 className="text-white font-bold text-xl mb-4">Roomify</h3>
                    <p className="max-w-xs">Simplifying rental search and verification for Pakistan's growing urban population.</p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2">
                        <li><Link to="/browse" className="hover:text-white">Find Properties</Link></li>
                        <li><Link to="/auth" className="hover:text-white">Sign In / Register</Link></li>
                        <li><Link to="/roommate-matches" className="hover:text-white">Roommate Matching</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Contact</h4>
                    <p>support@roomify.pk</p>
                    <p>Multan, Pakistan</p>
                </div>
            </div>
            <div className="container border-t border-neutral-800 mt-12 pt-8 text-center text-sm">
                © 2026 Roomify Rental System. Built with ❤️ for Multan.
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
