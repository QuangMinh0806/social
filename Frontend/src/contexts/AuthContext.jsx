import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const authStore = useAuthStore();

    useEffect(() => {
        // Initialize auth state from localStorage on app start
        authStore.initializeAuth();
    }, []);

    return (
        <AuthContext.Provider value={authStore}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};