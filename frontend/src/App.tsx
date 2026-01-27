import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/Auth';
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

const App: React.FC = () => {
    return (
        <Router>
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                {/* Navigation placeholder */}
                <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
                    <div className="container">
                        <div className="flex items-center justify-between h-16">
                            <a href="/" className="text-xl font-bold text-primary-500 flex items-center gap-2">
                                <span className="bg-primary-500 text-white p-1 rounded-lg">R</span>
                                Roomify
                            </a>
                            <div className="flex items-center gap-6">
                                <a href="/search" className="text-neutral-600 hover:text-primary-500 font-medium">
                                    Browse
                                </a>
                                <a href="/auth" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
                                    Sign In
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main content */}
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Navigate to="/search" replace />} />
                        <Route path="/auth" element={<AuthPage />} />

                        {/* Protected Routes */}
                        <Route path="/search" element={
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
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                <AdminDashboardPage />
                            </ProtectedRoute>
                        } />

                        {/* Landlord Dashboard Routes */}
                        <Route element={<RoleProtectedRoute allowedRoles={[UserRole.LANDLORD]} />}>
                            <Route path="/dashboard" element={<DashboardLayout />}>
                                <Route index element={<LandlordDashboard />} />
                                <Route path="requests" element={<LandlordDashboard />} />
                                <Route path="properties" element={<LandlordDashboard />} />
                                <Route path="properties/new" element={<AddPropertyPage />} />
                            </Route>
                        </Route>

                        <Route path="*" element={
                            <div className="container py-20 text-center">
                                <h1 className="text-6xl font-bold text-neutral-200 mb-4">404</h1>
                                <p className="text-xl text-neutral-500">Page not found</p>
                                <a href="/" className="mt-8 inline-block text-primary-600 font-bold underline">Go back home</a>
                            </div>
                        } />
                    </Routes>
                </main>

                {/* Footer */}
                <footer className="bg-neutral-900 text-neutral-400 py-12 mt-20">
                    <div className="container grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div>
                            <h3 className="text-white font-bold text-xl mb-4">Roomify</h3>
                            <p className="max-w-xs">Simplifying rental search and verification for Pakistan's growing urban population.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a href="/search" className="hover:text-white">Find Properties</a></li>
                                <li><a href="/auth" className="hover:text-white">Landlord Portal</a></li>
                                <li><a href="/admin" className="hover:text-white">Admin Dashboard</a></li>
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
        </Router>
    );
};

export default App;
