import axios from 'axios';
import type { ApiProblem } from '../types/api';

const TOKEN_KEY = 'ws_access_token';

/**
 * The access token is kept in sessionStorage: it survives a page refresh in the same
 * tab but is cleared when the tab closes. Incidents, users and alerts are never stored
 * client-side - they always come from the Java API.
 */
export function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Private-mode browsers can reject storage; the in-memory auth state still works.
  }
}

const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${base}/api`,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      setToken(null);
      window.dispatchEvent(new Event('ws:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/** Normalises any failure into a readable message plus optional field errors. */
export function toApiError(error: unknown): ApiProblem {
  if (axios.isAxiosError<ApiProblem>(error)) {
    if (error.response) {
      const problem = error.response.data ?? {};
      return {
        ...problem,
        status: error.response.status,
        detail: problem.detail ?? defaultDetail(error.response.status),
      };
    }
    if (error.code === 'ECONNABORTED') {
      return { status: 0, detail: 'The request timed out. Check that the backend is running.' };
    }
    return {
      status: 0,
      detail: 'Cannot reach the server. Start the Spring Boot backend on port 8080 and try again.',
    };
  }
  return { status: 0, detail: 'An unexpected error occurred. Please try again.' };
}

function defaultDetail(status: number): string {
  switch (status) {
    case 400:
      return 'Some details are invalid. Please review the form and try again.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested record could not be found.';
    case 409:
      return 'That action conflicts with the current state of the record.';
    case 429:
      return 'Too many attempts. Please wait a minute and try again.';
    default:
      return 'The server could not complete the request.';
  }
}
