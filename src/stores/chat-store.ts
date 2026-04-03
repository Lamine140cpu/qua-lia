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
}

interface ChatState {
  conversations: Record<string, CritereConversation>;

  getConversation: (critereId: string) => CritereConversation;
  addMessage: (critereId: string, message: ChatMessage) => void;
  removeMessage: (critereId: string, messageId: string) => void;
  appendToLastAssistant: (critereId: string, delta: string) => void;
  sanitizeConversation: (critereId: string) => void;
  setPhase: (critereId: string, phase: CriterePhase) => void;
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
  };
}

function sanitizeMessage(message: ChatMessage): ChatMessage | null {
  if (message.role === 'assistant' && !message.content.trim()) {
    return null;
  }

  return {
    ...message,
    content: message.content,
  };
}

function sanitizeMessages(messages: ChatMessage[] = []): ChatMessage[] {
  return messages.filter((message) => {
    if (message.role !== 'assistant') return true;
    return message.content.trim().length > 0;
  });
}

function normalizeConversation(
  critereId: string,
  conversation?: Partial<CritereConversation> | null,
): CritereConversation {
  const base = createEmptyConversation(critereId);

  return {
    ...base,
    ...conversation,
    critereId,
    phase: conversation?.phase ?? 'questions',
    messages: sanitizeMessages(conversation?.messages ?? []),
    generatedDocs: conversation?.generatedDocs ?? {},
  };
}

function normalizeConversations(
  conversations?: Record<string, Partial<CritereConversation>> | null,
): Record<string, CritereConversation> {
  if (!conversations) return {};

  return Object.entries(conversations).reduce<Record<string, CritereConversation>>((acc, [critereId, conversation]) => {
    acc[critereId] = normalizeConversation(critereId, conversation);
    return acc;
  }, {});
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},

      getConversation: (critereId) => normalizeConversation(critereId, get().conversations[critereId]),

      addMessage: (critereId, message) =>
        set((state) => {
          const sanitizedMessage = sanitizeMessage(message);
          if (!sanitizedMessage) {
            return { conversations: state.conversations };
          }

          const conversation = normalizeConversation(critereId, state.conversations[critereId]);

          return {
            conversations: {
              ...state.conversations,
              [critereId]: {
                ...conversation,
                messages: [...conversation.messages, sanitizedMessage],
              },
            },
          };
        }),

      removeMessage: (critereId, messageId) =>
        set((state) => {
          const conversation = normalizeConversation(critereId, state.conversations[critereId]);

          return {
            conversations: {
              ...state.conversations,
              [critereId]: {
                ...conversation,
                messages: conversation.messages.filter((message) => message.id !== messageId),
              },
            },
          };
        }),

      appendToLastAssistant: (critereId, delta) =>
        set((state) => {
          const conversation = state.conversations[critereId];
          if (!conversation || conversation.messages.length === 0) {
            return { conversations: state.conversations };
          }

          const messages = [...conversation.messages];
          const lastMessage = messages[messages.length - 1];

          if (lastMessage.role !== 'assistant') {
            return { conversations: state.conversations };
          }

          messages[messages.length - 1] = {
            ...lastMessage,
            content: `${lastMessage.content}${delta}`,
          };

          return {
            conversations: {
              ...state.conversations,
              [critereId]: {
                ...conversation,
                messages,
              },
            },
          };
        }),

      sanitizeConversation: (critereId) =>
        set((state) => {
          const conversation = state.conversations[critereId];
          if (!conversation) {
            return { conversations: state.conversations };
          }

          return {
            conversations: {
              ...state.conversations,
              [critereId]: normalizeConversation(critereId, conversation),
            },
          };
        }),

      setPhase: (critereId, phase) =>
        set((state) => {
          const conversation = normalizeConversation(critereId, state.conversations[critereId]);

          return {
            conversations: {
              ...state.conversations,
              [critereId]: { ...conversation, phase },
            },
          };
        }),

      addGeneratedDoc: (critereId, indicateurId, content) =>
        set((state) => {
          const conversation = normalizeConversation(critereId, state.conversations[critereId]);

          return {
            conversations: {
              ...state.conversations,
              [critereId]: {
                ...conversation,
                generatedDocs: {
                  ...conversation.generatedDocs,
                  [indicateurId]: {
                    content,
                    generatedAt: new Date().toISOString(),
                  },
                },
              },
            },
          };
        }),

      resetConversation: (critereId) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [critereId]: createEmptyConversation(critereId),
          },
        })),

      resetAll: () => set({ conversations: {} }),

      syncConversationToCloud: (critereId) => {
        const conversation = get().conversations[critereId];
        if (!conversation) return;

        const normalized = normalizeConversation(critereId, conversation);
        syncConversationToCloud(
          critereId,
          normalized.messages,
          normalized.phase,
          normalized.generatedDocs,
        );
      },

      loadFromCloud: async () => {
        const conversations = await loadConversationsFromCloud();
        if (conversations && Object.keys(conversations).length > 0) {
          set({ conversations: normalizeConversations(conversations) });
        }
      },
    }),
    {
      name: 'qualiopi-chat',
      version: 2,
      partialize: (state) => ({
        conversations: normalizeConversations(state.conversations),
      }),
      migrate: (persistedState) => {
        const persisted = persistedState as { conversations?: Record<string, Partial<CritereConversation>> } | undefined;

        return {
          conversations: normalizeConversations(persisted?.conversations),
        };
      },
    },
  ),
);
