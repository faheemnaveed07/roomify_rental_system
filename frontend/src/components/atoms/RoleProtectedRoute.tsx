import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { UserRole } from '@shared/types';

interface RoleProtectedRouteProps {
    allowedRoles: UserRole[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuthStore();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/auth" replace />;
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
        // If user is logged in but doesn't have the right role, redirect to home or unauthorized page
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default RoleProtectedRoute;
