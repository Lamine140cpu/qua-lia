import { supabase } from '@/integrations/supabase/client';
import { EDGE_FN } from '@/lib/constants';

/** Get auth headers for Edge Function calls */
async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
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
  const resp = await fetch(EDGE_FN.audit, {
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

// ── Supabase sync ──

export interface ProjectData {
  id?: string;
  name: string;
  cfa_info: any;
  formations: any[];
  organisation: any;
  selected_indicateurs: string[];
}

/** Save or update a project */
export async function saveProject(project: ProjectData): Promise<{ id: string }> {
  const resp = await fetch(`${EDGE_FN.sync}/project`, {
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
  const resp = await fetch(`${EDGE_FN.sync}/project`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.project || null;
}

/** Save documents state */
export async function saveDocuments(projectId: string, documents: Record<string, any>): Promise<void> {
  await fetch(`${EDGE_FN.sync}/documents`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ projectId, documents }),
  });
}

/** Load documents for a project */
export async function loadDocuments(projectId: string): Promise<Record<string, any>> {
  const resp = await fetch(`${EDGE_FN.sync}/documents?projectId=${projectId}`, {
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
  await fetch(`${EDGE_FN.sync}/conversation`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ projectId, critereId, messages, phase, generatedDocs }),
  });
}

/** Load conversations for a project */
export async function loadConversations(projectId: string): Promise<Record<string, any>> {
  const resp = await fetch(`${EDGE_FN.sync}/conversations?projectId=${projectId}`, {
    headers: await authHeaders(),
  });
  if (!resp.ok) return {};
  const data = await resp.json();
  return data.conversations || {};
}

// ── Improve document (streaming) ──

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
  const resp = await fetch(EDGE_FN.improveDocument, {
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
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          full += content;
          onDelta(content);
        }
      } catch {
        // Incomplete JSON, wait for more
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

/** Client-side validation — checks for common placeholder patterns */
export function validateDocuments(params: {
  documents: Record<string, any>;
  cfaInfo: any;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  const placeholderPatterns = [
    /\[À COMPLÉTER[^\]]*\]/gi,
    /\[NOM[^\]]*\]/gi,
    /\[ADRESSE[^\]]*\]/gi,
    /\[DATE[^\]]*\]/gi,
    /XXX/g,
    /Lorem ipsum/gi,
  ];

  for (const [id, doc] of Object.entries(params.documents)) {
    if ((doc as any).status !== 'generated' || !(doc as any).content) continue;
    const content = (doc as any).content as string;

    for (const pattern of placeholderPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        issues.push({
          indicateurId: id,
          type: 'placeholder',
          message: `${matches.length} placeholder(s) trouvé(s) : ${matches.slice(0, 3).join(', ')}`,
        });
        break;
      }
    }

    if (content.length < 500) {
      issues.push({
        indicateurId: id,
        type: 'incomplete',
        message: 'Document trop court (moins de 500 caractères)',
      });
    }
  }

  return {
    valid: issues.length === 0,
    issueCount: issues.length,
    issues,
  };
}

// ── Export mallette (client-side placeholder — needs DOCX Edge Function later) ──

export async function exportMallette(params: {
  documents: Record<string, any>;
  cfaInfo: any;
}): Promise<Blob> {
  // For now, export as a JSON bundle. DOCX export requires a dedicated Edge Function.
  const jsonStr = JSON.stringify(params, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}
