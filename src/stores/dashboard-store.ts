import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditResult } from '@/lib/api';
import { syncDocumentsToCloud, loadDocumentsFromCloud } from '@/lib/sync';

export type DocStatus = 'todo' | 'generating' | 'generated' | 'error';

export interface DocVersion {
  content: string;
  generatedAt: string;
  version: number;
}

export interface GeneratedDoc {
  indicateurId: string;
  status: DocStatus;
  content?: string;
  generatedAt?: string;
  error?: string;
  /** Document was generated with outdated CFA data */
  stale?: boolean;
  /** Version history */
  versions?: DocVersion[];
  /** Current version number */
  currentVersion?: number;
  /** Was this generated from an existing document (improve mode)? */
  improvedFrom?: string;
}

interface DashboardState {
  documents: Record<string, GeneratedDoc>;
  auditResult: AuditResult | null;
  auditLoading: boolean;
  auditError: string | null;

  setDocStatus: (id: string, status: DocStatus, extra?: Partial<GeneratedDoc>) => void;
  getDocForIndicateur: (id: string) => GeneratedDoc | undefined;
  setAuditResult: (result: AuditResult | null) => void;
  setAuditLoading: (loading: boolean) => void;
  setAuditError: (error: string | null) => void;
  /** Mark all generated documents as stale (CFA data changed) */
  markAllStale: () => void;
  /** Restore a previous version of a document */
  restoreVersion: (id: string, versionNum: number) => void;
  reset: () => void;
  syncToCloud: () => void;
  loadFromCloud: () => Promise<void>;
  /** Clean up documents stuck in 'generating' status (older than 5 min) */
  cleanupStuckGenerating: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      documents: {},
      auditResult: null,
      auditLoading: false,
      auditError: null,

      setDocStatus: (id, status, extra) =>
        set((s) => {
          const existing = s.documents[id];
          const versions = existing?.versions || [];
          let newVersions = versions;
          let currentVersion = existing?.currentVersion || 0;

          // Save current content as a version before overwriting (if regenerating)
          if (
            status === 'generated' &&
            extra?.content &&
            existing?.content &&
            existing.content !== extra.content
          ) {
            newVersions = [
              ...versions,
              {
                content: existing.content,
                generatedAt: existing.generatedAt || new Date().toISOString(),
                version: currentVersion,
              },
            ];
            currentVersion = currentVersion + 1;
          } else if (status === 'generated' && extra?.content && !existing?.content) {
            currentVersion = 1;
          }

          return {
            documents: {
              ...s.documents,
              [id]: {
                ...existing,
                indicateurId: id,
                status,
                stale: false,
                versions: newVersions,
                currentVersion,
                ...extra,
              },
            },
          };
        }),

      getDocForIndicateur: (id) => get().documents[id],
      setAuditResult: (result) => set({ auditResult: result, auditError: null }),
      setAuditLoading: (loading) => set({ auditLoading: loading }),
      setAuditError: (error) => set({ auditError: error, auditLoading: false }),

      markAllStale: () =>
        set((s) => {
          const updated: Record<string, GeneratedDoc> = {};
          for (const [id, doc] of Object.entries(s.documents)) {
            if (doc.status === 'generated') {
              updated[id] = { ...doc, stale: true };
            } else {
              updated[id] = doc;
            }
          }
          return { documents: updated };
        }),

      restoreVersion: (id, versionNum) =>
        set((s) => {
          const doc = s.documents[id];
          if (!doc?.versions) return s;
          const version = doc.versions.find(v => v.version === versionNum);
          if (!version) return s;

          // Save current as a version first
          const newVersions = [
            ...doc.versions,
            {
              content: doc.content || '',
              generatedAt: doc.generatedAt || new Date().toISOString(),
              version: doc.currentVersion || 0,
            },
          ];

          return {
            documents: {
              ...s.documents,
              [id]: {
                ...doc,
                content: version.content,
                generatedAt: version.generatedAt,
                currentVersion: (doc.currentVersion || 0) + 1,
                versions: newVersions,
                stale: false,
              },
            },
          };
        }),

      cleanupStuckGenerating: () =>
        set((s) => {
          const STUCK_TIMEOUT_MS = 5 * 60 * 1000;
          const fiveMinAgo = Date.now() - STUCK_TIMEOUT_MS;
          const updated: Record<string, GeneratedDoc> = {};
          for (const [id, doc] of Object.entries(s.documents)) {
            if (
              doc.status === 'generating' &&
              doc.generatedAt &&
              new Date(doc.generatedAt).getTime() < fiveMinAgo
            ) {
              updated[id] = { ...doc, status: 'error', error: 'Génération interrompue (timeout)' };
            } else if (doc.status === 'generating' && !doc.generatedAt) {
              updated[id] = { ...doc, status: 'error', error: 'Génération interrompue' };
            } else {
              updated[id] = doc;
            }
          }
          return { documents: updated };
        }),

      reset: () =>
        set({
          documents: {},
          auditResult: null,
          auditLoading: false,
          auditError: null,
        }),
      syncToCloud: () => {
        const s = get();
        syncDocumentsToCloud(s.documents);
      },
      loadFromCloud: async () => {
        const docs = await loadDocumentsFromCloud();
        if (docs && Object.keys(docs).length > 0) {
          set({ documents: docs });
        }
      },
    }),
    { name: 'qualiopi-dashboard' },
  ),
);
