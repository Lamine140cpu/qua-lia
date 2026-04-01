/** Edge Functions base URL */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const EDGE_FN = {
  chat: `${SUPABASE_URL}/functions/v1/chat`,
  generateDocument: `${SUPABASE_URL}/functions/v1/generate-document`,
  sync: `${SUPABASE_URL}/functions/v1/sync`,
  audit: `${SUPABASE_URL}/functions/v1/audit`,
  improveDocument: `${SUPABASE_URL}/functions/v1/improve-document`,
  exportMallette: `${SUPABASE_URL}/functions/v1/export-mallette`,
  generateVisual: `${SUPABASE_URL}/functions/v1/generate-visual`,
  exportDocx: `${SUPABASE_URL}/functions/v1/export-docx`,
};

/** Maximum file upload size in bytes (5 MB) */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Maximum notifications kept in store */
export const MAX_NOTIFICATIONS = 100;

/** Timeout for stuck 'generating' documents in ms (5 minutes) */
export const STUCK_GENERATING_TIMEOUT_MS = 5 * 60 * 1000;

/** @deprecated Use EDGE_FN instead */
export const API_BASE = SUPABASE_URL;
