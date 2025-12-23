/**
 * UploadThing Client Configuration
 * 
 * This file configures the UploadThing client to send authentication headers
 * with upload requests.
 */

import { getAuthHeaders } from './api-client';

// Custom fetch that includes auth headers for UploadThing
export const uploadthingFetch = async (url: string, options: RequestInit = {}) => {
  const authHeaders = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
};

