import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { authAPI, userAPI } from '../api';

interface User {
  _id: string;
  username: string;
  balance: number;
  settings: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  checkAuth: () => Promise<void>;
  updateUserSettings: (settings: Partial<User['settings']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await authAPI.getCurrentUser();
      setUser(data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Authentication check failed:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await authAPI.login(username, password);
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await authAPI.register(username, password);
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const updateUserSettings = async (settings: Partial<User['settings']>) => {
    try {
      setLoading(true);
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          settings: {
            ...prev.settings,
            ...settings
          }
        };
      });
      
      return settings;
    } catch (err) {
      console.error('Update settings error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await userAPI.getProfile();
      setUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    fetchProfile,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
    updateUserSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};