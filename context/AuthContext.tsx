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

  /**
   * Validate session by calling /api/auth/me
   */
  const validateSession = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) return false;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
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
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return false;
  };

  // Listen for session invalid events from apiRequest
  useEffect(() => {
    const handleSessionInvalid = () => {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    };

    window.addEventListener('auth:session-invalid', handleSessionInvalid);
    return () => {
      window.removeEventListener('auth:session-invalid', handleSessionInvalid);
    };
  }, []);

  /**
   * Check if token is close to expiration (within 1 hour) and refresh if needed
   */
  const checkAndRefreshToken = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) return false;

    const decoded = decodeToken(storedToken);
    if (!decoded || !decoded.exp) return false;

    // Check if token expires within 1 hour (3600 seconds)
    const expiresIn = decoded.exp * 1000 - Date.now();
    const oneHour = 60 * 60 * 1000;

    if (expiresIn < oneHour && expiresIn > 0) {
      // Token is close to expiration, validate session to get fresh user data
      return await validateSession();
    }

    return true;
  };

  useEffect(() => {
    // Check for stored user session and token
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (storedUser && storedToken) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          // Token expired, try to validate session (in case server has different expiration)
          validateSession().finally(() => setIsLoading(false));
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Ensure token cookie is set (in case it was cleared)
        const cookieToken = document.cookie.split('; ').find(row => row.startsWith('token='));
        if (!cookieToken) {
          const expires = new Date();
          expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
          document.cookie = `token=${storedToken}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        }

        // Validate session in background
        validateSession();
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Clear token cookie
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
    setIsLoading(false);
  }, []);

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      await validateSession();
      await checkAndRefreshToken();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Check token expiration periodically (every minute)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setUser(null);
        return;
      }

      if (isTokenExpired(storedToken)) {
        // Token expired, try to validate session
        const isValid = await validateSession();
        if (!isValid) {
          // Session invalid, user will need to login again
          setUser(null);
        }
      } else {
        // Check if we should refresh token
        await checkAndRefreshToken();
      }
    }, 60 * 1000); // 1 minute

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

      if (data.user && data.token) {
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        
        // Set token as cookie so middleware can access it
        // Cookie expires in 7 days (matching JWT expiration)
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `token=${data.token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        
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
    // Clear token cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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