/**
 * @file api.ts
 * @description Centralized HTTP request client wrapper for backend communications.
 * 
 * BUSINESS CONTEXT:
 * Consumes the LOS REST API endpoint services. Sets default JSON content type headers,
 * automatically injects active JWT session Bearer tokens from localStorage, and maps
 * standard backend API response schemas and errors into client exceptions.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * Common request dispatcher wrapper
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Retrieve token from browser local storage
  const token = typeof window !== 'undefined' ? localStorage.getItem('los_token') : null;

  // We only set Content-Type to JSON if it's not FormData (which sets its own boundary)
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMessage = json.message || 'API request failed';
    const err = new Error(errorMessage) as any;
    err.status = response.status;
    err.errors = json.errors;
    throw err;
  }

  return json;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),
    
  postFormData: <T = any>(endpoint: string, formData: FormData, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),
    
  put: <T = any>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
    
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
export default api;
