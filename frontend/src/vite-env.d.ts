/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    /** Server root URL (no /api suffix) — used for assets and socket */
    readonly VITE_API_URL: string;
    /** Optional: dedicated socket URL; falls back to VITE_API_URL */
    readonly VITE_SOCKET_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
