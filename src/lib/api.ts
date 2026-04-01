import { supabase } from '@/integrations/supabase/client';
import { API_BASE } from '@/lib/constants';

/** Get auth headers for API calls */
async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// ── Audit ──

export interface AuditIndicateur {
  id: string;
  titre: string;
  score: 'conforme' | 'partiellement_conforme' | 'non_conforme';
  score_num: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nc_risk: 'aucun' | 'mineure' | 'majeure';
  nc_detail: string;
}

export interface AuditCritere {
  critere_id: string;
  critere_titre: string;
  score: 'conforme' | 'partiellement_conforme' | 'non_conforme';
  indicateurs: AuditIndicateur[];
}

export interface AuditResult {
  date: string;
  overall_score: 'conforme' | 'partiellement_conforme' | 'non_conforme';
  overall_percentage: number;
  overall_summary: string;
  criteria: AuditCritere[];
  priority_actions: string[];
  audit_readiness: string;
}

export async function requestAudit(params: {
  documents: Record<string, any>;
  cfaInfo: any;
  selectedIndicateurs: string[];
}): Promise<AuditResult> {
  const resp = await fetch(`${API_BASE}/api/audit`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(params),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(data.error || `Erreur ${resp.status}`);
  }

  return resp.json();
}

export async function healthCheck(): Promise<{ status: string; model: string }> {
  const resp = await fetch(`${API_BASE}/api/health`);
  return resp.json();
}

// ── Supabase sync ──

export interface ProjectData {
  id?: string;
  name: string;
  cfa_info: any;
  formations: any[];
  organisation: any;
  selected_indicateurs: string[];
}

/** Save or update a project in Supabase */
export async function saveProject(project: ProjectData): Promise<{ id: string }> {
  const resp = await fetch(`${API_BASE}/api/sync/project`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(project),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: 'Erreur sync' }));
    throw new Error(data.error || `Erreur ${resp.status}`);
  }
  return resp.json();
}

/** Load the user's latest project */
export async function loadProject(): Promise<ProjectData | null> {
  const resp = await fetch(`${API_BASE}/api/sync/project`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.project || null;
}

/** Save documents state */
export async function saveDocuments(projectId: string, documents: Record<string, any>): Promise<void> {
  await fetch(`${API_BASE}/api/sync/documents`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ projectId, documents }),
  });
}

/** Load documents for a project */
export async function loadDocuments(projectId: string): Promise<Record<string, any>> {
  const resp = await fetch(`${API_BASE}/api/sync/documents?projectId=${projectId}`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) return {};
  const data = await resp.json();
  return data.documents || {};
}

/** Save a conversation */
export async function saveConversation(
  projectId: string,
  critereId: string,
  messages: any[],
  phase: string,
  generatedDocs: Record<string, any>,
): Promise<void> {
  await fetch(`${API_BASE}/api/sync/conversation`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ projectId, critereId, messages, phase, generatedDocs }),
  });
}

/** Load conversations for a project */
export async function loadConversations(projectId: string): Promise<Record<string, any>> {
  const resp = await fetch(`${API_BASE}/api/sync/conversations?projectId=${projectId}`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) return {};
  const data = await resp.json();
  return data.conversations || {};
}

// ── Improve document ──

export async function improveDocument(
  params: {
    indicateurId: string;
    existingContent: string;
    cfaInfo: any;
    formations: any[];
    organisation: any;
  },
  onDelta: (text: string) => void,
): Promise<string> {
  const resp = await fetch(`${API_BASE}/api/improve-document`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(params),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(data.error || `Erreur ${resp.status}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('Streaming non supporté');

  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'delta') {
          full += event.text;
          onDelta(event.text);
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      } catch (e: any) {
        if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
  }
  return full;
}

// ── Validate documents (anti-placeholder) ──

export interface ValidationIssue {
  indicateurId: string;
  type: 'placeholder' | 'coherence' | 'incomplete';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issueCount: number;
  issues: ValidationIssue[];
}

export async function validateDocuments(params: {
  documents: Record<string, any>;
  cfaInfo: any;
}): Promise<ValidationResult> {
  const resp = await fetch(`${API_BASE}/api/validate-documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(data.error || `Erreur ${resp.status}`);
  }
  return resp.json();
}

// ── Export mallette complète (DOCX) ──

export async function exportMallette(params: {
  documents: Record<string, any>;
  cfaInfo: any;
}): Promise<Blob> {
  const resp = await fetch(`${API_BASE}/api/export-zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(data.error || `Erreur ${resp.status}`);
  }
  const arrayBuf = await resp.arrayBuffer();
  return new Blob([arrayBuf], { type: 'application/zip' });
}
