import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncConversationToCloud, loadConversationsFromCloud } from '@/lib/sync';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  /** If the assistant message contains a generated document */
  document?: {
    indicateurId: string;
    titre: string;
    content: string;
  };
}

export type CriterePhase = 'questions' | 'generating' | 'done';

export interface CritereConversation {
  critereId: string;
  messages: ChatMessage[];
  phase: CriterePhase;
  /** Documents generated during this conversation */
  generatedDocs: Record<string, { content: string; generatedAt: string }>;
  /** Whether the AI is currently responding */
  streaming: boolean;
}

interface ChatState {
  conversations: Record<string, CritereConversation>;

  getConversation: (critereId: string) => CritereConversation;
  addMessage: (critereId: string, message: ChatMessage) => void;
  removeMessage: (critereId: string, messageId: string) => void;
  appendToLastAssistant: (critereId: string, delta: string) => void;
  setPhase: (critereId: string, phase: CriterePhase) => void;
  setStreaming: (critereId: string, streaming: boolean) => void;
  addGeneratedDoc: (critereId: string, indicateurId: string, content: string) => void;
  resetConversation: (critereId: string) => void;
  resetAll: () => void;
  syncConversationToCloud: (critereId: string) => void;
  loadFromCloud: () => Promise<void>;
}

function createEmptyConversation(critereId: string): CritereConversation {
  return {
    critereId,
    messages: [],
    phase: 'questions',
    generatedDocs: {},
    streaming: false,
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},

      getConversation: (critereId) => {
        return get().conversations[critereId] || createEmptyConversation(critereId);
      },

      addMessage: (critereId, message) =>
        set((s) => {
          const conv = s.conversations[critereId] || createEmptyConversation(critereId);
          return {
            conversations: {
              ...s.conversations,
              [critereId]: { ...conv, messages: [...conv.messages, message] },
            },
          };
        }),

      removeMessage: (critereId, messageId) =>
        set((s) => {
          const conv = s.conversations[critereId] || createEmptyConversation(critereId);
          return {
            conversations: {
              ...s.conversations,
              [critereId]: {
                ...conv,
                messages: conv.messages.filter((m) => m.id !== messageId),
              },
            },
          };
        }),

      appendToLastAssistant: (critereId, delta) =>
        set((s) => {
          const conv = s.conversations[critereId];
          if (!conv || conv.messages.length === 0) return s;
          const messages = [...conv.messages];
          const last = messages[messages.length - 1];
          if (last.role === 'assistant') {
            messages[messages.length - 1] = { ...last, content: last.content + delta };
          }
          return {
            conversations: {
              ...s.conversations,
              [critereId]: { ...conv, messages },
            },
          };
        }),

      setPhase: (critereId, phase) =>
        set((s) => {
          const conv = s.conversations[critereId] || createEmptyConversation(critereId);
          return {
            conversations: {
              ...s.conversations,
              [critereId]: { ...conv, phase },
            },
          };
        }),

      setStreaming: (critereId, streaming) =>
        set((s) => {
          const conv = s.conversations[critereId] || createEmptyConversation(critereId);
          return {
            conversations: {
              ...s.conversations,
              [critereId]: { ...conv, streaming },
            },
          };
        }),

      addGeneratedDoc: (critereId, indicateurId, content) =>
        set((s) => {
          const conv = s.conversations[critereId] || createEmptyConversation(critereId);
          return {
            conversations: {
              ...s.conversations,
              [critereId]: {
                ...conv,
                generatedDocs: {
                  ...conv.generatedDocs,
                  [indicateurId]: { content, generatedAt: new Date().toISOString() },
                },
              },
            },
          };
        }),

      resetConversation: (critereId) =>
        set((s) => ({
          conversations: {
            ...s.conversations,
            [critereId]: createEmptyConversation(critereId),
          },
        })),

      resetAll: () => set({ conversations: {} }),

      syncConversationToCloud: (critereId) => {
        const conv = get().conversations[critereId];
        if (conv) {
          syncConversationToCloud(critereId, conv.messages, conv.phase, conv.generatedDocs);
        }
      },

      loadFromCloud: async () => {
        const convs = await loadConversationsFromCloud();
        if (convs && Object.keys(convs).length > 0) {
          set({ conversations: convs });
        }
      },
    }),
    { name: 'qualiopi-chat' },
  ),
);
