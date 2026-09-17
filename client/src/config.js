// Centralized Configuration for Production & Local Development
// In Vercel, define VITE_API_URL and VITE_SOCKET_URL in Environment Variables.

const rawApiUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawApiUrl.replace(/\/$/, '');

// If VITE_SOCKET_URL or VITE_API_URL is configured, use it for WebSockets.
// Otherwise in local development, connect to port 3001 on localhost or current origin.
export const SOCKET_SERVER_URL = 
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://127.0.0.1:3001' : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3001'));

/**
 * Builds full API URL. In local dev with Vite proxy, returns relative path '/api/...'.
 * In production with separate backend, returns 'https://backend.onrender.com/api/...'.
 */
export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}
