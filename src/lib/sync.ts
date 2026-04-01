import { supabase } from '@/integrations/supabase/client';
import { saveProject, loadProject, saveDocuments, loadDocuments, saveConversation, loadConversations } from '@/lib/api';
import { useNotificationStore } from '@/stores/notification-store';

/** Current project ID in Supabase (null = not synced yet) */
let currentProjectId: string | null = null;

export function getProjectId() { return currentProjectId; }
export function setProjectId(id: string | null) { currentProjectId = id; }

function notifySyncError(context: string) {
  try {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title: 'Erreur de synchronisation',
      description: `${context} — vos données sont sauvegardées localement.`,
    });
  } catch {
    // Store might not be initialized yet
  }
}

/**
 * Sync wizard store data to Supabase.
 * Called after important wizard actions (step change, save).
 */
export async function syncWizardToCloud(wizardState: {
  cfaInfo: any;
  formations: any[];
  organisation: any;
  selectedIndicateurs: string[];
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // Not logged in — skip

  try {
    const result = await saveProject({
      id: currentProjectId || undefined,
      name: wizardState.cfaInfo?.nom || 'Mon CFA',
      cfa_info: wizardState.cfaInfo,
      formations: wizardState.formations,
      organisation: wizardState.organisation,
      selected_indicateurs: wizardState.selectedIndicateurs,
    });
    currentProjectId = result.id;
  } catch (err) {
    console.warn('Sync wizard error:', err);
    notifySyncError('Projet');
  }
}

/**
 * Load wizard data from cloud on login.
 * Returns the saved state or null if nothing saved.
 */
export async function loadWizardFromCloud(): Promise<{
  cfaInfo: any;
  formations: any[];
  organisation: any;
  selectedIndicateurs: string[];
} | null> {
  try {
    const project = await loadProject();
    if (!project) return null;
    currentProjectId = project.id || null;
    return {
      cfaInfo: project.cfa_info,
      formations: project.formations,
      organisation: project.organisation,
      selectedIndicateurs: project.selected_indicateurs,
    };
  } catch (err) {
    console.warn('Load wizard from cloud error:', err);
    notifySyncError('Chargement projet');
    return null;
  }
}

/**
 * Sync documents to cloud.
 */
export async function syncDocumentsToCloud(documents: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !currentProjectId) return;

  try {
    await saveDocuments(currentProjectId, documents);
  } catch (err) {
    console.warn('Sync documents error:', err);
    notifySyncError('Documents');
  }
}

/**
 * Load documents from cloud.
 */
export async function loadDocumentsFromCloud(): Promise<Record<string, any> | null> {
  if (!currentProjectId) return null;
  try {
    return await loadDocuments(currentProjectId);
  } catch (err) {
    console.warn('Load documents from cloud error:', err);
    notifySyncError('Chargement documents');
    return null;
  }
}

/**
 * Sync a conversation to cloud.
 */
export async function syncConversationToCloud(
  critereId: string,
  messages: any[],
  phase: string,
  generatedDocs: Record<string, any>,
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !currentProjectId) return;

  try {
    await saveConversation(currentProjectId, critereId, messages, phase, generatedDocs);
  } catch (err) {
    console.warn('Sync conversation error:', err);
    notifySyncError('Conversation');
  }
}

/**
 * Load all conversations from cloud.
 */
export async function loadConversationsFromCloud(): Promise<Record<string, any> | null> {
  if (!currentProjectId) return null;
  try {
    return await loadConversations(currentProjectId);
  } catch (err) {
    console.warn('Load conversations from cloud error:', err);
    notifySyncError('Chargement conversations');
    return null;
  }
}
