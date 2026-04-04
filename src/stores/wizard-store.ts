import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncWizardToCloud, loadWizardFromCloud } from '@/lib/sync';
import { useDashboardStore } from '@/stores/dashboard-store';

export type TypeAction = 'of' | 'bc' | 'vae' | 'cfa';
export type AuditStatus = 'initial' | 'renouvellement';

export interface CfaInfo {
  nom: string;
  siret: string;
  adresse: string;
  ville: string;
  codePostal: string;
  siteWeb: string;
  email: string;
  telephone: string;
  nda: string;
  uai: string;
  responsable: string;
  /** Types d'actions couverts par la certification Qualiopi */
  typesActions: TypeAction[];
  /** Nouvel entrant (audit initial) ou renouvellement */
  auditStatus: AuditStatus;
}

/** Tracking of collected proofs per indicateur */
export interface PreuveCollected {
  preuveId: string;
  collected: boolean;
  note?: string;
  fileName?: string;
  collectedAt?: string;
}

export interface Formation {
  id: string;
  intitule: string;
  rncp: string;
  niveau: string;
  duree: string;
  publics: string[];
}

export interface Organisation {
  referentHandicap: string;
  referentHandicapEmail: string;
  effectifFormateurs: number;
  plateformeLMS: string;
  moyensPedagogiques: string[];
  locaux: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string; // MIME type
  /** Text content extracted from the file (for docs) */
  textContent?: string;
  /** Base64 data URI (for images/logo) */
  dataUri?: string;
  /** Which indicateur this file is a proof for (optional) */
  indicateurId?: string;
  uploadedAt: string;
}

export interface WizardState {
  currentStep: number;
  cfaInfo: CfaInfo;
  formations: Formation[];
  organisation: Organisation;
  selectedIndicateurs: string[];
  /** Uploaded files (logo, existing docs, proofs) */
  uploadedFiles: UploadedFile[];
  /** Collected proofs per indicateur */
  collectedPreuves: Record<string, PreuveCollected[]>;

  setCurrentStep: (step: number) => void;
  setCfaInfo: (info: Partial<CfaInfo>) => void;
  addFormation: (formation: Formation) => void;
  removeFormation: (id: string) => void;
  updateFormation: (id: string, data: Partial<Formation>) => void;
  setOrganisation: (org: Partial<Organisation>) => void;
  setSelectedIndicateurs: (ids: string[]) => void;
  toggleIndicateur: (id: string) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  /** Mark a proof as collected or not */
  setPreuveCollected: (indicateurId: string, preuveId: string, collected: boolean, note?: string) => void;
  reset: () => void;
  /** Sync current state to Supabase */
  syncToCloud: () => void;
  /** Load state from Supabase (on login) */
  loadFromCloud: () => Promise<void>;
}

const initialCfaInfo: CfaInfo = {
  nom: '', siret: '', adresse: '', ville: '', codePostal: '',
  siteWeb: '', email: '', telephone: '', nda: '', uai: '', responsable: '',
  typesActions: [], auditStatus: 'initial',
};

const initialOrganisation: Organisation = {
  referentHandicap: '', referentHandicapEmail: '', effectifFormateurs: 1,
  plateformeLMS: '', moyensPedagogiques: [], locaux: '',
};

/** Mark existing generated documents as stale when CFA data changes */
function notifyDataChanged() {
  useDashboardStore.getState().markAllStale();
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      cfaInfo: initialCfaInfo,
      formations: [],
      organisation: initialOrganisation,
      selectedIndicateurs: [],
      uploadedFiles: [],

      setCurrentStep: (step) => set({ currentStep: step }),
      setCfaInfo: (info) => {
        set((s) => ({ cfaInfo: { ...s.cfaInfo, ...info } }));
        notifyDataChanged();
      },
      addFormation: (f) => {
        set((s) => ({ formations: [...s.formations, f] }));
        notifyDataChanged();
      },
      removeFormation: (id) => {
        set((s) => ({ formations: s.formations.filter(f => f.id !== id) }));
        notifyDataChanged();
      },
      updateFormation: (id, data) => {
        set((s) => ({
          formations: s.formations.map(f => f.id === id ? { ...f, ...data } : f)
        }));
        notifyDataChanged();
      },
      setOrganisation: (org) => {
        set((s) => ({ organisation: { ...s.organisation, ...org } }));
        notifyDataChanged();
      },
      setSelectedIndicateurs: (ids) => set({ selectedIndicateurs: ids }),
      addUploadedFile: (file) => set((s) => ({ uploadedFiles: [...s.uploadedFiles, file] })),
      removeUploadedFile: (id) => set((s) => ({ uploadedFiles: s.uploadedFiles.filter(f => f.id !== id) })),
      toggleIndicateur: (id) => set((s) => ({
        selectedIndicateurs: s.selectedIndicateurs.includes(id)
          ? s.selectedIndicateurs.filter(i => i !== id)
          : [...s.selectedIndicateurs, id]
      })),
      reset: () => set({
        currentStep: 0, cfaInfo: initialCfaInfo, formations: [],
        organisation: initialOrganisation, selectedIndicateurs: [], uploadedFiles: [],
      }),
      syncToCloud: () => {
        const s = get();
        syncWizardToCloud({
          cfaInfo: s.cfaInfo,
          formations: s.formations,
          organisation: s.organisation,
          selectedIndicateurs: s.selectedIndicateurs,
        });
      },
      loadFromCloud: async () => {
        const cloud = await loadWizardFromCloud();
        if (cloud) {
          set({
            cfaInfo: { ...initialCfaInfo, ...cloud.cfaInfo },
            formations: cloud.formations || [],
            organisation: { ...initialOrganisation, ...cloud.organisation },
            selectedIndicateurs: cloud.selectedIndicateurs || [],
          });
        }
      },
    }),
    { name: 'qualiopi-wizard' }
  )
);
