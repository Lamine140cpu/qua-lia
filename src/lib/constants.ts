/** Maximum file upload size in bytes (5 MB) */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Maximum notifications kept in store */
export const MAX_NOTIFICATIONS = 100;

/** Timeout for stuck 'generating' documents in ms (5 minutes) */
export const STUCK_GENERATING_TIMEOUT_MS = 5 * 60 * 1000;

/** API base URL — uses env var or falls back to current origin */
export const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;
