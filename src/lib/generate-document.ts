import { type CfaInfo, type Formation, type Organisation } from '@/stores/wizard-store';
import { API_BASE } from '@/lib/constants';

interface GenerateParams {
  indicateurId: string;
  cfaInfo: CfaInfo;
  formations: Formation[];
  organisation: Organisation;
  previousDocuments?: Record<string, string>;
}

export async function generateDocument(
  params: GenerateParams,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal,
) {
  const url = `${API_BASE}/api/generate-document`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6);

        try {
          const parsed = JSON.parse(jsonStr);

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

    // If we reach here without a 'done' event, call onDone anyway
    onDone();
  } catch (e: any) {
    if (e.name === 'AbortError') return;
    onError(e instanceof Error ? e.message : 'Erreur inconnue');
  }
}
