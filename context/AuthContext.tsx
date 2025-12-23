'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

interface TokenPayload {
  userId: string;
  role: string;
  exp?: number;
  iat?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'family-site-user';
const TOKEN_STORAGE_KEY = 'family-site-token';

/**
 * Decode JWT token without verification (client-side only)
 * Note: Actual verification happens on the server
 */
function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session and token
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (storedUser && storedToken) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          // Token expired, clear storage
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

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

      if (data.user && data.token) {
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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