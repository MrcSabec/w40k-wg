// Centralized Configuration for Production & Local Development
// Supports:
// 1. Local development (fallback to Vite proxy on port 3001)
// 2. Vercel build-time environment variable (VITE_API_URL)
// 3. Runtime user override (localStorage 'wg_backend_url')

function formatUrl(url) {
  if (!url) return '';
  let clean = url.trim().replace(/\/$/, '');

  // Ignore placeholder examples
  if (
    clean.includes('seu-backend') ||
    clean.includes('sua-url') ||
    clean.includes('w40k-xxxx') ||
    clean.includes('exemplo') ||
    clean === 'https://' ||
    clean === 'http://'
  ) {
    return '';
  }

  // Ensure protocol is present so browser does not treat it as relative path on Vercel
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  return clean;
}

export function getBackendUrl() {
  if (typeof window !== 'undefined') {
    // 1. Check runtime localStorage override
    const saved = localStorage.getItem('wg_backend_url');
    const formattedSaved = formatUrl(saved);
    if (formattedSaved) {
      return formattedSaved;
    }
  }

  // 2. Check build-time Vite environment variable
  const envUrl = formatUrl(import.meta.env.VITE_API_URL);
  if (envUrl) {
    return envUrl;
  }

  // 3. In local development, return empty string so Vite proxy forwards '/api' to 127.0.0.1:3001
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
  }

  return '';
}

export function setBackendUrl(url) {
  if (typeof window !== 'undefined') {
    const formatted = formatUrl(url);
    if (!formatted) {
      localStorage.removeItem('wg_backend_url');
    } else {
      localStorage.setItem('wg_backend_url', formatted);
    }
  }
}

export function isMissingBackendUrl() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  // If running locally, Vite proxy works automatically
  if (host === 'localhost' || host === '127.0.0.1') return false;
  // In production (Vercel, etc.), check if a valid backend URL is configured
  const current = getBackendUrl();
  return !current;
}

export function getSocketUrl() {
  const backend = getBackendUrl();
  if (backend) return backend;

  const envSocket = formatUrl(import.meta.env.VITE_SOCKET_URL);
  if (envSocket) return envSocket;

  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://127.0.0.1:3001';
  }

  return typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3001';
}

export const API_BASE_URL = getBackendUrl();
export const SOCKET_SERVER_URL = getSocketUrl();

/**
 * Builds full API URL. In local dev with Vite proxy, returns relative path '/api/...'.
 * In production, returns 'https://backend.onrender.com/api/...'.
 */
export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getBackendUrl();
  if (!base) {
    return cleanPath;
  }
  return `${base}${cleanPath}`;
}
