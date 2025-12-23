// Client-side API helper functions

const TOKEN_STORAGE_KEY = 'family-site-token';

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Validate session by calling /api/auth/me
 * This can be used to refresh user data or check if session is still valid
 */
export async function validateSession(): Promise<{ valid: boolean; user?: any }> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    return { valid: false };
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        return { valid: true, user: data.user };
      }
    }
  } catch (error) {
    console.error('Session validation error:', error);
  }

  return { valid: false };
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401) {
    // Try to validate session once
    const session = await validateSession();
    if (!session.valid) {
      // Session is invalid, clear storage
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('family-site-user');
      
      // Dispatch custom event for AuthContext to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-invalid'));
      }
    }
  }

  return response;
}

