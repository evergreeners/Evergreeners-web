
/**
 * Centralized API configuration for the Evergreeners application.
 * Handles environment-specific URLs and production detection.
 */

const getBaseURL = (url?: string) => {
    // If explicitly provided via env, use it
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        return url;
    }

    // Local development fallbacks
    const isLocal = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    if (isLocal) {
        return "http://localhost:3000";
    }

    // Production heuristic (if VITE_API_URL is missing in Railway)
    // If we are on the web domain, we likely need the API domain
    if (window.location.hostname.includes("evergreeners-web-production.up.railway.app")) {
        // We can't know the exact API URL for sure, but we can try to warn or guess
        // For now, return empty which will lead to a relative fetch (fails with 404 on static host)
        // BUT we can at least log a helpful message
        console.warn("Evergreeners: VITE_API_URL is not set. API calls will likely fail. Please set VITE_API_URL in your Railway dashboard.");
    }

    return ""; // Falls back to relative paths
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
