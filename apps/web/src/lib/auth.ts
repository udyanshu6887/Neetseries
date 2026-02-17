// Auth token utilities for client-side API calls

const TOKEN_KEY = "mir_auth_token";
const USER_KEY = "mir_auth_user";

export function setAuthToken(token: string) {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

export function getAuthToken(): string | null {
    if (typeof window !== "undefined") {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

export function setAuthUser(user: { id: string; email: string; name: string; role: string }) {
    if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

export function getAuthUser(): { id: string; email: string; name: string; role: string } | null {
    if (typeof window !== "undefined") {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) return JSON.parse(raw);
    }
    return null;
}

export function clearAuth() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

/**
 * Wrapper around fetch that automatically injects the auth Bearer token.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    const headers = new Headers(options.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers });
}
