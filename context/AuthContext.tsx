'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'family-site-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Validate session by calling /api/auth/me
   */
  const validateSession = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          return true;
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }

    // Session invalid, clear storage
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    return false;
  };

  // Listen for session invalid events from apiRequest
  useEffect(() => {
    const handleSessionInvalid = () => {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    };

    window.addEventListener('auth:session-invalid', handleSessionInvalid);

    // Listen for profile updates dispatched elsewhere in the app
    const handleProfileUpdated = (e: Event) => {
      try {
        // detail may contain updated user object
        const detail = (e as CustomEvent).detail;
        if (detail && typeof detail === 'object') {
          setUser(detail as User);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(detail));
        }
      } catch (err) {
        console.error('Failed to handle profile updated event', err);
      }
    };

    window.addEventListener('auth:profile-updated', handleProfileUpdated as EventListener);

    return () => {
      window.removeEventListener('auth:session-invalid', handleSessionInvalid);
      window.removeEventListener('auth:profile-updated', handleProfileUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Validate session in background (will refresh stored user if needed)
        validateSession();
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } else {
      // Validate session on initial load
      validateSession().finally(() => setIsLoading(false));
    }
    setIsLoading(false);
  }, []);

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      await validateSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          return {
            success: false,
            error: data.error || 'Too many login attempts. Please try again later.',
          };
        }
        
        // Handle other errors
        return {
          success: false,
          error: data.error || 'Login failed. Please check your credentials.',
        };
      }

      if (data.user) {
        // Server sets HttpOnly cookie; store user for client UI only
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        return { success: true };
      }
      
      return {
        success: false,
        error: 'Invalid response from server',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  };

  // Update user in context and localStorage without full reload
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('Failed to store updated user', err);
    }
  };


  const logout = () => {
    // Call server logout to clear cookie
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}