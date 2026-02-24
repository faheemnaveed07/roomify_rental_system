import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthPage from './pages/Auth';
import HomePage from '@pages/Home';
import SearchPage from './pages/Search';
import PropertyDetailPage from './pages/PropertyDetail';
import AdminDashboardPage from './pages/AdminDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import AddPropertyPage from './pages/AddProperty';
import MyBookingsPage from './pages/MyBookings';
import DashboardLayout from './components/organisms/DashboardLayout';
import ProtectedRoute from './components/organisms/ProtectedRoute';
import RoleProtectedRoute from './components/atoms/RoleProtectedRoute';
import { UserRole } from '@shared/types';
import Header from './components/organisms/Header';
import AdminLayout from './components/organisms/AdminLayout';
import AdminUsersPage from './pages/AdminUsers';
import AdminAnalyticsPage from './pages/AdminAnalytics';

const AppLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Header />

            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/auth" element={<AuthPage />} />

                    <Route path="/browse" element={
                        <ProtectedRoute>
                            <SearchPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/search" element={<Navigate to="/browse" replace />} />
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
                    <Route element={<RoleProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboardPage />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="analytics" element={<AdminAnalyticsPage />} />
                        </Route>
                    </Route>

                    <Route element={<RoleProtectedRoute allowedRoles={[UserRole.LANDLORD]} />}>
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<LandlordDashboard />} />
                            <Route path="requests" element={<LandlordDashboard />} />
                            <Route path="properties" element={<LandlordDashboard />} />
                            <Route path="properties/new" element={<Navigate to="/add-property" replace />} />
                        </Route>
                        <Route element={<DashboardLayout />}>
                            <Route path="/add-property" element={<AddPropertyPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={
                        <div className="container py-20 text-center">
                            <h1 className="text-6xl font-bold text-neutral-200 mb-4">404</h1>
                            <p className="text-xl text-neutral-500">Page not found</p>
                            <Link to="/" className="mt-8 inline-block text-primary-600 font-bold underline">Go back home</Link>
                        </div>
                    } />
                </Routes>
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
                            <li><Link to="/auth" className="hover:text-white">Landlord Portal</Link></li>
                            <li><Link to="/admin" className="hover:text-white">Admin Dashboard</Link></li>
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
};

const App: React.FC = () => (
    <Router>
        <AppLayout />
    </Router>
);

export default App;
