import { create } from 'zustand';
import { authService } from '../services/authService.js';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Initialize auth state from localStorage
  initializeAuth: () => {
    const token = authService.getStoredToken();
    const user = authService.getStoredUser();
    
    if (token && user) {
      set({
        token,
        user,
        isAuthenticated: true
      });
    }
  },

  // Login action
  login: async (credentials) => {
    set({ isLoading: true });
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        set({
          user: result.data.user,
          token: result.data.access_token,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: 'Đăng nhập thất bại' };
    }
  },

  // Register action
  register: async (userData) => {
    set({ isLoading: true });
    
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        set({
          user: result.data.user,
          token: result.data.access_token,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: 'Đăng ký thất bại' };
    }
  },

  // Logout action
  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },

  // Update user info
  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
    localStorage.setItem('auth_user', JSON.stringify({ ...get().user, ...userData }));
  },

  // Check if user has specific role
  hasRole: (role) => {
    const { user } = get();
    return user?.role === role;
  },

  // Check if user is admin or higher
  isAdminOrHigher: () => {
    const { user } = get();
    return ['admin', 'superadmin', 'root'].includes(user?.role);
  },

  // Check if user is superadmin or higher
  isSuperAdminOrHigher: () => {
    const { user } = get();
    return ['superadmin', 'root'].includes(user?.role);
  },

  // Check if user is root
  isRoot: () => {
    const { user } = get();
    return user?.role === 'root';
  },

  // Check if user can manage target role
  canManageRole: (targetRole) => {
    const { user } = get();
    if (!user) return false;
    
    const roleHierarchy = {
      'root': ['root', 'superadmin', 'admin'],
      'superadmin': ['superadmin', 'admin'],
      'admin': ['admin']
    };
    
    return roleHierarchy[user.role]?.includes(targetRole) || false;
  },

  // Check if user can view target role
  canViewRole: (targetRole) => {
    const { user } = get();
    if (!user) return false;
    
    // Similar logic to canManageRole
    const roleHierarchy = {
      'root': ['root', 'superadmin', 'admin'],
      'superadmin': ['superadmin', 'admin'],
      'admin': ['admin']
    };
    
    return roleHierarchy[user.role]?.includes(targetRole) || false;
  },

  // Get user role label
  getRoleLabel: (role) => {
    const roleLabels = {
      root: 'Root',
      superadmin: 'Super Admin',
      admin: 'Admin'
    };
    return roleLabels[role] || role;
  },

  // Get available roles for creation based on current user
  getAvailableRoles: () => {
    const { user } = get();
    
    if (user?.role === 'root') {
      return [
        { value: 'root', label: 'Root' },
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' }
      ];
    } else if (user?.role === 'superadmin') {
      return [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' }
      ];
    } else if (user?.role === 'admin') {
      return [
        { value: 'admin', label: 'Admin' }
      ];
    }
    
    return [];
  }
}));