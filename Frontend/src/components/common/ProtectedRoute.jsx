import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = [] }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    // Check if user is authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check specific role requirement
    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check multiple roles requirement
    if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export const AdminRoute = ({ children }) => {
    return (
        <ProtectedRoute requiredRoles={['admin', 'superadmin', 'root']}>
            {children}
        </ProtectedRoute>
    );
};

export const SuperAdminRoute = ({ children }) => {
    return (
        <ProtectedRoute requiredRoles={['superadmin', 'root']}>
            {children}
        </ProtectedRoute>
    );
};

export const RootRoute = ({ children }) => {
    return (
        <ProtectedRoute requiredRole="root">
            {children}
        </ProtectedRoute>
    );
};