import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { logout, setCredentials } from './authSlice';

// Single in-flight refresh promise so concurrent 401s share one /refresh call
let refreshPromise = null;

const rawRefresh = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.access_token || !data?.refresh_token) return null;
        return data;
    } catch {
        return null;
    }
};

const ensureRefreshed = () => {
    if (!refreshPromise) {
        refreshPromise = rawRefresh().finally(() => {
            // Clear after a tick so any retries that lost the race still use the new tokens
            setTimeout(() => { refreshPromise = null; }, 0);
        });
    }
    return refreshPromise;
};

const PROTECTED_PATHS = ['/profile', '/notifications'];

const handleAuthFailure = (api) => {
    api.dispatch(logout());
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isProtected = PROTECTED_PATHS.some(p => path.startsWith(p));
        if (isProtected) {
            window.location.href = `/login?returnTo=${encodeURIComponent(path + window.location.search)}`;
        }
    }
};

/**
 * Wraps fetchBaseQuery with auto-refresh on 401.
 * - On 401, attempts /auth/refresh once (shared across concurrent calls)
 * - On success, retries the original request with new token
 * - On failure, dispatches logout() and redirects to /login
 */
export const buildBaseQueryWithReauth = (baseUrl) => {
    const rawBase = fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    });

    return async (args, api, extraOptions) => {
        let result = await rawBase(args, api, extraOptions);

        // Skip refresh for the refresh endpoint itself or for unauth endpoints
        const url = typeof args === 'string' ? args : args?.url || '';
        const isAuthFlow = url.includes('/auth/login') || url.includes('/auth/register')
            || url.includes('/auth/refresh') || url.includes('/auth/forgot-password')
            || url.includes('/auth/reset-password');

        if (result.error?.status === 401 && !isAuthFlow) {
            const refreshed = await ensureRefreshed();
            if (refreshed) {
                localStorage.setItem('token', refreshed.access_token);
                localStorage.setItem('refresh_token', refreshed.refresh_token);
                api.dispatch(setCredentials({
                    user: JSON.parse(localStorage.getItem('user') || 'null'),
                    token: refreshed.access_token,
                    refreshToken: refreshed.refresh_token,
                }));
                result = await rawBase(args, api, extraOptions);
            } else {
                handleAuthFailure(api);
            }
        }

        return result;
    };
};
