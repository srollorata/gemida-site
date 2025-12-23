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

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(endpoint, {
    ...options,
    headers,
  });
}

