
/**
 * Centralized API configuration for the Evergreeners application.
 * Handles environment-specific URLs and production detection.
 */

const getBaseURL = (url?: string) => {
    // Local development fallbacks
    const isLocal = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    if (isLocal) {
        return "http://localhost:3000";
    }

    // In production, force relative paths so it uses the Vercel API proxy.
    // This solves all cross-domain cookie issues (Brave/Firefox state_mismatch).
    return "";
};

export const API_BASE_URL = getBaseURL(import.meta.env.VITE_API_URL);

/**
 * Helper to build full API URLs
 */
export const getApiUrl = (slug: string) => {
    const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const path = slug.startsWith("/") ? slug : `/${slug}`;
    return `${base}${path}`;
};
