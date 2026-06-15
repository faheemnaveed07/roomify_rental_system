/**
 * Centralized origin allow-list used by CORS, CSRF, and Socket.IO.
 *
 * Why a shared helper:
 *  - Vercel issues a NEW preview URL on every deployment
 *    (e.g. roomify-rental-system-<hash>-<team>.vercel.app) plus a stable
 *    production alias (roomify-rental-system.vercel.app). Hard-coding a single
 *    FRONTEND_URL means the whitelist breaks every redeploy.
 *  - Config values often arrive with a stray trailing slash or whitespace,
 *    which an exact `===` / `.includes()` check silently rejects.
 *
 * So we normalize (trim + strip trailing slash) and additionally accept any
 * Vercel deployment of THIS project via a regex.
 */

const normalize = (o: string): string => o.trim().replace(/\/+$/, '');

const STATIC_ORIGINS: string[] = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5001',
    process.env.FRONTEND_URL,
]
    .filter((o): o is string => Boolean(o))
    .map(normalize);

// Production alias + every preview deployment of the roomify-rental-system project.
// e.g. https://roomify-rental-system.vercel.app
//      https://roomify-rental-system-ab12cd-faheem-naveed-s-projects.vercel.app
const VERCEL_PROJECT = /^https:\/\/roomify-rental-system[a-z0-9-]*\.vercel\.app$/i;

/**
 * Returns true when the given origin is allowed.
 * A missing origin (same-origin requests, curl, mobile apps) is allowed.
 */
export const isAllowedOrigin = (origin?: string | null): boolean => {
    if (!origin) return true;
    const normalized = normalize(origin);
    return STATIC_ORIGINS.includes(normalized) || VERCEL_PROJECT.test(normalized);
};

export const staticAllowedOrigins = STATIC_ORIGINS;
