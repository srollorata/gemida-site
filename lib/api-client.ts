// Client-side API helper functions

// Using HttpOnly cookie-based sessions. No client-managed Authorization header.
export function getAuthHeaders(): HeadersInit {
  return {};
}

/**
 * Validate session by calling /api/auth/me
 * This can be used to refresh user data or check if session is still valid
 */
export async function validateSession(): Promise<{ valid: boolean; user?: any }> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
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
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401) {
    // Try to validate session once (cookie-based)
    const session = await validateSession();
    if (!session.valid) {
      // Session is invalid, clear storage
      localStorage.removeItem('family-site-user');
      
      // Dispatch custom event for AuthContext to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-invalid'));
      }
    }
  }

  // Handle 403 Forbidden - insufficient permissions
  if (response.status === 403) {
    try {
      const body = await response.json().catch(() => ({}));
      const message = body?.error || 'Forbidden';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: { message } }));
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: { message: 'Forbidden' } }));
      }
    }
  }

  return response;
}

