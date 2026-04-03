import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { useWizardStore } from '@/stores/wizard-store';
import { useChatStore, type ChatMessage } from '@/stores/chat-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { RNQ_V9, CRITERE_COLORS } from '@/data/rnq-v9';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, RotateCcw, Sparkles, ArrowUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/sanitize';
import { EDGE_FN } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { marked } from 'marked';

const SESSION_EXPIRED_MESSAGE = 'Session expirée — veuillez vous reconnecter.';
const AUTO_START_DELAY_MS = 150;

function extractDocuments(content: string): { indicateurId: string; titre: string; docContent: string }[] {
  const regex = /\[DOCUMENT:([^\]:]+):([^\]]+)\]\n([\s\S]*?)\n\[\/DOCUMENT\]/g;
  const docs: { indicateurId: string; titre: string; docContent: string }[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    docs.push({
      indicateurId: match[1].trim(),
      titre: match[2].trim(),
      docContent: match[3].trim(),
    });
  }

  return docs;
}

function extractAndApplyContextUpdates(
  content: string,
  setCfaInfo: (info: any) => void,
  setOrganisation: (org: any) => void,
) {
  const regex = /\[CONTEXT_UPDATE\]\n([\s\S]*?)\n\[\/CONTEXT_UPDATE\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const lines = match[1].trim().split('\n');
    const cfaFields: Record<string, string> = {};
    const orgFields: Record<string, any> = {};

    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;

      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim();

      if (
        ['nom', 'siret', 'nda', 'uai', 'responsable', 'adresse', 'ville', 'codePostal', 'siteWeb', 'email', 'telephone'].includes(key)
      ) {
        cfaFields[key] = value;
      }

      if (['plateformeLMS', 'locaux', 'referentHandicap', 'referentHandicapEmail'].includes(key)) {
        orgFields[key] = value;
      }

      if (key === 'effectifFormateurs') {
        orgFields[key] = parseInt(value, 10) || undefined;
      }

      if (key === 'moyensPedagogiques') {
        orgFields[key] = value.split(',').map((entry: string) => entry.trim());
      }
    }

    if (Object.keys(cfaFields).length > 0) setCfaInfo(cfaFields);
    if (Object.keys(orgFields).length > 0) setOrganisation(orgFields);
  }
}

function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-primary mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-primary mt-2 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\|(.+)$/gm, (line) => {
      const cells = line.split('|').filter((cell) => cell.trim());
      if (cells.every((cell) => /^[\s-:]+$/.test(cell))) return '';
      return `<tr>${cells.map((cell) => `<td class="border border-border px-2 py-1 text-xs">${cell.trim()}</td>`).join('')}</tr>`;
    })
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-primary pl-3 italic text-muted-foreground text-xs my-1">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-xs list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-xs list-decimal">$2</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function renderMarkdown(text: string): string {
  const raw = marked.parse(text, { async: false, breaks: true }) as string;
  return sanitizeHtml(raw);
}

function renderMessageContent(content: string) {
  const parts = content.split(/\[DOCUMENT:[^\]]+\][\s\S]*?\[\/DOCUMENT\]/g);
  const docs = extractDocuments(content);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part.trim()) {
      elements.push(
        <div
          key={`text-${index}`}
          className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-h2:mt-4 prose-h2:mb-2 prose-h3:mt-3 prose-h3:mb-1 prose-hr:my-3 prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(part.trim()) }}
        />,
      );
    }

    if (docs[index]) {
      elements.push(<DocumentPreview key={`doc-${index}`} doc={docs[index]} />);
    }
  });

  return elements.length > 0 ? (
    elements
  ) : (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-strong:text-foreground"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

function DocumentPreview({ doc }: { doc: { indicateurId: string; titre: string; docContent: string } }) {
  const [expanded, setExpanded] = useState(false);
  const previewHtml = simpleMarkdownToHtml(
    expanded ? doc.docContent : doc.docContent.split('\n').slice(0, 30).join('\n'),
  );
  const totalLines = doc.docContent.split('\n').length;

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">{doc.titre}</span>
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {doc.indicateurId}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{totalLines} lignes</span>
      </div>
      <div
        className="max-h-[500px] overflow-y-auto px-5 py-4 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
      />
      <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
        {totalLines > 30 ? (
          <button
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {expanded ? 'Réduire' : `Voir tout (${totalLines} lignes)`}
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs text-muted-foreground">Téléchargeable ci-dessous</span>
      </div>
    </div>
  );
}

const TypingIndicator = forwardRef<HTMLDivElement>(function TypingIndicator(_props, ref) {
  return (
    <div ref={ref} className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

export default function AgentChat() {
  const { critereId } = useParams<{ critereId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cfaInfo, formations, organisation, setCfaInfo, setOrganisation } = useWizardStore();
  const {
    getConversation,
    addMessage,
    appendToLastAssistant,
    addGeneratedDoc,
    resetConversation,
    sanitizeConversation,
  } = useChatStore();
  const { setDocStatus } = useDashboardStore();
  const { fetchSubscription } = useSubscriptionStore();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoStartedRef = useRef<Set<string>>(new Set());

  const critere = critereId ? RNQ_V9[critereId] : undefined;
  const conversation = critereId ? getConversation(critereId) : undefined;
  const generatedDocs = conversation?.generatedDocs || {};

  useEffect(() => {
    fetchSubscription().then(() => {
      const planId = useSubscriptionStore.getState().currentPlanId;
      if (planId === 'gratuit' && critereId && critereId !== 'critere1') {
        navigate('/pricing', { replace: true });
      }
    });
  }, [critereId, fetchSubscription, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isStreaming, showTypingIndicator]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const getValidAccessToken = useCallback(
    async (forceRefresh = false): Promise<string> => {
      if (forceRefresh) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session?.access_token) throw new Error(SESSION_EXPIRED_MESSAGE);
        return data.session.access_token;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) return session.access_token;

      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session?.access_token) throw new Error(SESSION_EXPIRED_MESSAGE);
      return data.session.access_token;
    },
    [],
  );

  const persistGeneratedOutput = useCallback(
    (fullContent: string) => {
      if (!critereId || !fullContent.trim()) return;

      const docs = extractDocuments(fullContent);
      for (const doc of docs) {
        addGeneratedDoc(critereId, doc.indicateurId, doc.docContent);
        setDocStatus(doc.indicateurId, 'generated', {
          content: doc.docContent,
          generatedAt: new Date().toISOString(),
        });
      }

      if (docs.length > 0) {
        toast({ title: `${docs.length} document(s) généré(s)` });
      }

      extractAndApplyContextUpdates(fullContent, setCfaInfo, setOrganisation);
    },
    [critereId, addGeneratedDoc, setDocStatus, toast, setCfaInfo, setOrganisation],
  );

  const sendToAgent = useCallback(
    async (history: ChatMessage[]) => {
      if (!critereId || !critere || abortRef.current) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setShowTypingIndicator(true);

      let assistantMessageId: string | null = null;
      let fullContent = '';

      const appendAssistantDelta = (delta: string) => {
        fullContent += delta;

        if (!assistantMessageId) {
          assistantMessageId = crypto.randomUUID();
          addMessage(critereId, {
            id: assistantMessageId,
            role: 'assistant',
            content: delta,
            timestamp: new Date().toISOString(),
          });
        } else {
          appendToLastAssistant(critereId, delta);
        }

        setShowTypingIndicator(false);
      };

      try {
        const doFetch = async (token: string) =>
          fetch(EDGE_FN.chat, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              critereId,
              critereTitle: `Critère ${critereId.replace('critere', '')} — ${critere.titre}`,
              messages: history.map((message) => ({ role: message.role, content: message.content })),
              cfaInfo,
              formations,
              organisation,
            }),
            signal: controller.signal,
          });

        let accessToken = await getValidAccessToken();
        let response = await doFetch(accessToken);

        if (response.status === 401) {
          accessToken = await getValidAccessToken(true);
          response = await doFetch(accessToken);
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(SESSION_EXPIRED_MESSAGE);
          }

          const data = await response.json().catch(() => ({ error: 'Erreur réseau' }));
          throw new Error(data.error || `Erreur ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Pas de réponse du serveur');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamComplete = false;

        while (!streamComplete) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (!line || line.startsWith(':') || !line.startsWith('data: ')) {
              continue;
            }

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamComplete = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                appendAssistantDelta(delta);
              }
            } catch {
              // Ignore incomplete chunks and wait for the next line.
            }
          }
        }

        persistGeneratedOutput(fullContent);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }

        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        if (message === SESSION_EXPIRED_MESSAGE) {
          toast({
            title: 'Session expirée',
            description: 'Reconnectez-vous pour continuer le chat.',
            variant: 'destructive',
          });
          navigate('/auth', { replace: true });
          return;
        }

        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
        setShowTypingIndicator(false);
      }
    },
    [
      critereId,
      critere,
      cfaInfo,
      formations,
      organisation,
      addMessage,
      appendToLastAssistant,
      getValidAccessToken,
      navigate,
      persistGeneratedOutput,
      toast,
    ],
  );

  const sendToAgentRef = useRef(sendToAgent);

  useEffect(() => {
    sendToAgentRef.current = sendToAgent;
  }, [sendToAgent]);

  useEffect(() => {
    if (!critereId || !critere) return;

    textareaRef.current?.focus();
    setInput('');
    setIsStreaming(false);
    setShowTypingIndicator(false);

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    sanitizeConversation(critereId);

    const currentConversation = useChatStore.getState().getConversation(critereId);
    if (currentConversation.messages.length > 0 || autoStartedRef.current.has(critereId)) {
      return;
    }

    autoStartedRef.current.add(critereId);
    const timer = window.setTimeout(() => {
      const latestConversation = useChatStore.getState().getConversation(critereId);
      if (latestConversation.messages.length === 0 && !abortRef.current) {
        void sendToAgentRef.current([]);
      }
    }, AUTO_START_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [critereId, critere, sanitizeConversation]);

  const handleSend = useCallback(() => {
    if (!critereId || !input.trim() || isStreaming) return;

    const trimmedInput = input.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };

    addMessage(critereId, userMessage);
    setInput('');

    const history = useChatStore.getState().getConversation(critereId).messages;
    void sendToAgent(history);
  }, [critereId, input, isStreaming, addMessage, sendToAgent]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleRestart = useCallback(() => {
    if (!critereId) return;
    if (!window.confirm('Recommencer la conversation ?')) return;

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setIsStreaming(false);
    setShowTypingIndicator(false);
    setInput('');
    resetConversation(critereId);
    autoStartedRef.current.delete(critereId);

    window.setTimeout(() => {
      autoStartedRef.current.add(critereId);
      void sendToAgentRef.current([]);
    }, 100);
  }, [critereId, resetConversation]);

  const handleDownloadDoc = async (indicateurId: string, content: string, format: 'docx' | 'xlsx' = 'docx') => {
    try {
      toast({ title: 'Export en cours…' });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(EDGE_FN.exportDocx, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          action: 'single',
          markdown: content,
          filename: `${indicateurId}_${cfaInfo.nom || 'organisme'}`,
          cfaInfo,
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erreur export' }));
        throw new Error(error.error || `Erreur ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${indicateurId}_${cfaInfo.nom || 'organisme'}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: `Document ${format.toUpperCase()} téléchargé !` });
    } catch (error: any) {
      toast({
        title: 'Erreur export',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!critereId || !critere) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Critère introuvable.</p>
      </div>
    );
  }

  const critereNum = critereId.replace('critere', '');
  const accentColor = CRITERE_COLORS[critereId as keyof typeof CRITERE_COLORS] || '216 72% 30%';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: `hsl(${accentColor})` }}
            >
              {critereNum}
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">{critere.titre}</h1>
              <p className="text-xs text-muted-foreground">
                {Object.keys(critere.indicateurs).length} indicateurs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {Object.keys(generatedDocs).length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {Object.keys(generatedDocs).length} doc(s)
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestart}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="h-px w-full bg-border/50" />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <AnimatePresence initial={false}>
              {conversation?.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {message.role === 'user' ? (
                    <div className="flex justify-end px-4 py-4">
                      <div className="max-w-[85%] sm:max-w-[70%]">
                        <div className="rounded-2xl rounded-br-md bg-muted/70 px-4 py-3 text-sm leading-relaxed text-foreground">
                          <span className="whitespace-pre-wrap">{message.content}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-5 transition-colors hover:bg-muted/20">
                      <div className="flex gap-3">
                        <div
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `hsl(${accentColor} / 0.1)` }}
                        >
                          <Sparkles className="h-3.5 w-3.5" style={{ color: `hsl(${accentColor})` }} />
                        </div>
                        <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                          {renderMessageContent(message.content)}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {showTypingIndicator && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <div className="px-4 py-5 transition-colors hover:bg-muted/20">
                    <div className="flex gap-3">
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `hsl(${accentColor} / 0.1)` }}
                      >
                        <Sparkles className="h-3.5 w-3.5" style={{ color: `hsl(${accentColor})` }} />
                      </div>
                      <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {Object.keys(generatedDocs).length > 0 && (
          <div className="border-t border-border/50 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(generatedDocs).map(([id, doc]) => (
                <div key={id} className="flex gap-1">
                  <button
                    onClick={() => handleDownloadDoc(id, doc.content, 'docx')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
                  >
                    <Download className="h-3 w-3" /> {id}.docx
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(id, doc.content, 'xlsx')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground"
                  >
                    <Download className="h-3 w-3" /> .xlsx
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-6 pt-2">
          <div className="relative rounded-2xl border border-border/60 bg-muted/40 transition-all focus-within:border-border focus-within:bg-muted/60">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              className="min-h-[52px] max-h-[200px] w-full resize-none rounded-2xl bg-transparent px-4 pb-12 pt-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              rows={1}
            />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
