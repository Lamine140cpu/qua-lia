import { type CfaInfo, type Formation, type Organisation } from '@/stores/wizard-store';
import { EDGE_FN } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';

interface GenerateParams {
  indicateurId: string;
  cfaInfo: CfaInfo;
  formations: Formation[];
  organisation: Organisation;
  previousDocuments?: Record<string, string>;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
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

export async function generateDocument(
  params: GenerateParams,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal,
) {
  try {
    const resp = await fetch(EDGE_FN.generateDocument, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(params),
      signal,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
      onError(data.error || `Erreur ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError('Pas de réponse du serveur');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line.startsWith(':') || line === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);

          // Handle OpenAI-compatible SSE format from Lovable AI
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onDelta(content);
          }

          // Handle legacy format
          if (parsed.type === 'delta' && parsed.text) {
            onDelta(parsed.text);
          } else if (parsed.type === 'done') {
            onDone();
            return;
          } else if (parsed.type === 'error') {
            onError(parsed.message || 'Erreur de génération');
            return;
          }
        } catch {
          // Incomplete JSON, wait for more data
        }
      }
    }

    onDone();
  } catch (e: any) {
    if (e.name === 'AbortError') return;
    onError(e instanceof Error ? e.message : 'Erreur inconnue');
  }
}
