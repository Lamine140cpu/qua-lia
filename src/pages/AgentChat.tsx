import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { useWizardStore } from '@/stores/wizard-store';
import { useChatStore, type ChatMessage } from '@/stores/chat-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { RNQ_V9 } from '@/data/rnq-v9';
import { CRITERE_COLORS } from '@/data/rnq-v9';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Send, Download, FileText, RotateCcw, User, Sparkles, ArrowUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/sanitize';
import { EDGE_FN } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { marked } from 'marked';

const SESSION_EXPIRED_MESSAGE = 'Session expirée — veuillez vous reconnecter.';

/** Extract [DOCUMENT:id:title]...[/DOCUMENT] blocks from assistant messages */
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

/** Extract [CONTEXT_UPDATE]...[/CONTEXT_UPDATE] and apply to wizard store */
function extractAndApplyContextUpdates(content: string, setCfaInfo: (info: any) => void, setOrganisation: (org: any) => void) {
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

      if (['nom', 'siret', 'nda', 'uai', 'responsable', 'adresse', 'ville', 'codePostal', 'siteWeb', 'email', 'telephone'].includes(key)) {
        cfaFields[key] = value;
      }
      if (['plateformeLMS', 'locaux', 'referentHandicap', 'referentHandicapEmail'].includes(key)) {
        orgFields[key] = value;
      }
      if (key === 'effectifFormateurs') {
        orgFields[key] = parseInt(value, 10) || undefined;
      }
      if (key === 'moyensPedagogiques') {
        orgFields[key] = value.split(',').map((s: string) => s.trim());
      }
    }

    if (Object.keys(cfaFields).length > 0) setCfaInfo(cfaFields);
    if (Object.keys(orgFields).length > 0) setOrganisation(orgFields);
  }
}

/** Simple markdown to HTML converter for document preview */
function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-primary mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-primary mt-2 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\|(.+)$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
      return '<tr>' + cells.map(c => `<td class="border border-border px-2 py-1 text-xs">${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-primary pl-3 italic text-muted-foreground text-xs my-1">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-xs list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-xs list-decimal">$2</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

/** Convert markdown text to sanitized HTML */
function renderMarkdown(text: string): string {
  const raw = marked.parse(text, { async: false, breaks: true }) as string;
  return sanitizeHtml(raw);
}

/** Render message content: show document preview with visual rendering */
function renderMessageContent(content: string) {
  const parts = content.split(/\[DOCUMENT:[^\]]+\][\s\S]*?\[\/DOCUMENT\]/g);
  const docs = extractDocuments(content);

  const elements: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part.trim()) {
      elements.push(
        <div
          key={`text-${i}`}
          className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-h2:mt-4 prose-h2:mb-2 prose-h3:mt-3 prose-h3:mb-1 prose-hr:my-3 prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(part.trim()) }}
        />
      );
    }
    if (docs[i]) {
      elements.push(
        <DocumentPreview key={`doc-${i}`} doc={docs[i]} />
      );
    }
  });

  return elements.length > 0 ? elements : (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-strong:text-foreground"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

/** Visual document preview component */
function DocumentPreview({ doc }: { doc: { indicateurId: string; titre: string; docContent: string } }) {
  const [expanded, setExpanded] = useState(false);
  const previewHtml = simpleMarkdownToHtml(
    expanded ? doc.docContent : doc.docContent.split('\n').slice(0, 30).join('\n')
  );
  const totalLines = doc.docContent.split('\n').length;

  return (
    <div className="my-4 rounded-2xl border border-border/60 bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-medium text-sm text-foreground">{doc.titre}</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {doc.indicateurId}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{totalLines} lignes</span>
      </div>
      <div
        className="px-5 py-4 text-sm leading-relaxed max-h-[500px] overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
      />
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40">
        {totalLines > 30 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {expanded ? 'Réduire' : `Voir tout (${totalLines} lignes)`}
          </button>
        ) : <span />}
        <span className="text-xs text-muted-foreground">
          Téléchargeable ci-dessous
        </span>
      </div>
    </div>
  );
}

/** Typing indicator — 3 pulsing dots like Claude */
const TypingIndicator = forwardRef<HTMLDivElement>(function TypingIndicator(_props, ref) {
  return (
    <div ref={ref} className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
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
    getConversation, addMessage, appendToLastAssistant,
    setStreaming, addGeneratedDoc, removeMessage, resetConversation,
  } = useChatStore();
  const { setDocStatus } = useDashboardStore();

  const [input, setInput] = useState('');
  const [chatReady, setChatReady] = useState(true); // Start ready — guard is in handleSend
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { currentPlanId, fetchSubscription } = useSubscriptionStore();

  const critere = critereId ? RNQ_V9[critereId] : undefined;
  const conversation = critereId ? getConversation(critereId) : undefined;

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
  }, [conversation?.messages, conversation?.streaming]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const getValidAccessToken = useCallback(
    async (forceRefresh = false): Promise<string> => {
      if (forceRefresh) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session?.access_token) throw new Error(SESSION_EXPIRED_MESSAGE);
        return data.session.access_token;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session.access_token;

      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session?.access_token) throw new Error(SESSION_EXPIRED_MESSAGE);
      return data.session.access_token;
    },
    [],
  );

  const sendToAgent = useCallback(async (history: ChatMessage[]) => {
    if (!critereId || !critere) return;

    const assistantMsgId = crypto.randomUUID();
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(critereId, true);

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMessage(critereId, assistantMsg);
    let fullContent = '';
    let hasReceivedDelta = false;

    const persistGeneratedOutput = () => {
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
    };

    try {
      const doFetch = async (token: string) => fetch(EDGE_FN.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          critereId,
          critereTitle: `Critère ${critereId.replace('critere', '')} — ${critere.titre}`,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          cfaInfo,
          formations,
          organisation,
        }),
        signal: controller.signal,
      });

      let accessToken = await getValidAccessToken();
      let resp = await doFetch(accessToken);

      // Retry once on 401 after refreshing session
      if (resp.status === 401) {
        accessToken = await getValidAccessToken(true);
        resp = await doFetch(accessToken);
      }

      if (!resp.ok) {
        if (resp.status === 401) {
          throw new Error(SESSION_EXPIRED_MESSAGE);
        }
        const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(data.error || `Erreur ${resp.status}`);
      }

      if (!resp.body) throw new Error('Pas de réponse du serveur');

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

          // Skip SSE comments (e.g. ": OPENROUTER PROCESSING")
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();

          // Handle stream termination signal
          if (jsonStr === '[DONE]') {
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
            setStreaming(critereId, false);
            abortRef.current = null;
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            // OpenAI-compatible format from Lovable AI
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              hasReceivedDelta = true;
              fullContent += content;
              appendToLastAssistant(critereId, content);
            }
          } catch (e: any) {
            if (e.message && !e.message.includes('JSON')) throw e;
          }
        }
      }

      // Fallback: process docs if stream ended without [DONE]
      persistGeneratedOutput();
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return;
      }

      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      if (message === SESSION_EXPIRED_MESSAGE) {
        toast({
          title: 'Session expirée',
          description: 'Reconnectez-vous pour continuer le chat.',
          variant: 'destructive',
        });
        navigate('/auth', { replace: true });
        return;
      }

      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      if (!hasReceivedDelta) {
        removeMessage(critereId, assistantMsgId);
      }
      setStreaming(critereId, false);
      abortRef.current = null;
    }
  }, [critereId, critere, cfaInfo, formations, organisation, addMessage, appendToLastAssistant, setStreaming, addGeneratedDoc, removeMessage, setDocStatus, setCfaInfo, setOrganisation, toast, navigate, getValidAccessToken]);

  // Consolidated mount effect: fix stuck state + auto-send
  const sentRef = useRef(false);
  const sendToAgentRef = useRef(sendToAgent);

  useEffect(() => {
    sendToAgentRef.current = sendToAgent;
  }, [sendToAgent]);

  useEffect(() => {
    if (!critereId || !critere) return;

    let cancelled = false;
    const focusFrame = requestAnimationFrame(() => textareaRef.current?.focus());

    sentRef.current = false;
    setChatReady(false);
    setInput('');

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const conv = useChatStore.getState().getConversation(critereId);
    const isStuck = conv.streaming && !abortRef.current;
    const hasOnlyEmptyMessages =
      conv.messages.length > 0 && conv.messages.every((m) => m.role === 'assistant' && !m.content);
    const hasStaleEmptyMessages = hasOnlyEmptyMessages && !conv.streaming && !abortRef.current;

    if (isStuck || hasStaleEmptyMessages) {
      console.log('[AgentChat] Stuck state detected, resetting', critereId);
      resetConversation(critereId);
    } else {
      if (conv.streaming) {
        setStreaming(critereId, false);
      }

      const staleAssistantIds = conv.messages
        .filter((m) => m.role === 'assistant' && !m.content.trim())
        .map((m) => m.id);

      staleAssistantIds.forEach((id) => removeMessage(critereId, id));
    }

    (async () => {
      try {
        await getValidAccessToken();
        if (cancelled) return;

        setChatReady(true);

        const freshConv = useChatStore.getState().getConversation(critereId);
        if (!sentRef.current && freshConv.messages.length === 0 && !freshConv.streaming) {
          sentRef.current = true;
          sendToAgentRef.current([]);
        }
      } catch {
        if (cancelled) return;
        toast({
          title: 'Session expirée',
          description: 'Reconnectez-vous pour relancer le chat.',
          variant: 'destructive',
        });
        navigate('/auth', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(focusFrame);
    };
  }, [critereId, critere, getValidAccessToken, navigate, removeMessage, resetConversation, setStreaming, toast]);

  const isRequestInFlight = Boolean(conversation?.streaming && abortRef.current);

  const handleSend = useCallback(() => {
    if (!chatReady || !input.trim() || !critereId || !conversation) return;
    if (isRequestInFlight) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    addMessage(critereId, userMsg);
    setInput('');

    const newHistory = [...conversation.messages, userMsg];
    sendToAgent(newHistory);
  }, [chatReady, input, critereId, conversation, isRequestInFlight, addMessage, sendToAgent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownloadDoc = async (indicateurId: string, content: string, format: 'docx' | 'xlsx' = 'docx') => {
    try {
      toast({ title: 'Export en cours…' });
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(EDGE_FN.exportDocx, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          action: 'single',
          markdown: content,
          filename: `${indicateurId}_${cfaInfo.nom || 'organisme'}`,
          cfaInfo,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erreur export' }));
        throw new Error(err.error || `Erreur ${resp.status}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${indicateurId}_${cfaInfo.nom || 'organisme'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Document DOCX téléchargé !' });
    } catch (e: any) {
      toast({ title: 'Erreur export', description: e.message, variant: 'destructive' });
    }
  };

  if (!critereId || !critere) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Critère introuvable.</p>
      </div>
    );
  }

  const critereNum = critereId.replace('critere', '');
  const accentColor = CRITERE_COLORS[critereId as keyof typeof CRITERE_COLORS] || '216 72% 30%';
  const generatedDocs = conversation?.generatedDocs || {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        rightContent={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {/* Minimal header */}
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: `hsl(${accentColor})` }}
            >
              {critereNum}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">{critere.titre}</h1>
              <p className="text-xs text-muted-foreground">
                {Object.keys(critere.indicateurs).length} indicateurs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {Object.keys(generatedDocs).length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {Object.keys(generatedDocs).length} doc(s)
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm('Recommencer la conversation ?')) {
                  resetConversation(critereId);
                  setTimeout(() => sendToAgent([]), 100);
                }
              }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* Messages — Claude style: no bubbles for assistant, subtle for user */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {conversation?.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {msg.role === 'user' ? (
                    /* User message — right-aligned subtle bubble */
                    <div className="px-4 py-4 flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[70%]">
                        <div className="bg-muted/70 rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed text-foreground">
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Assistant message — full width, no bubble, like Claude */
                    <div className="px-4 py-5 hover:bg-muted/20 transition-colors">
                      <div className="flex gap-3">
                        <div
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                          style={{ backgroundColor: `hsl(${accentColor} / 0.1)` }}
                        >
                          <Sparkles className="w-3.5 h-3.5" style={{ color: `hsl(${accentColor})` }} />
                        </div>
                        <div className="flex-1 min-w-0 text-sm leading-relaxed text-foreground">
                          {msg.content ? (
                            renderMessageContent(msg.content)
                          ) : conversation.streaming ? (
                            <TypingIndicator />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Generated docs — minimal pills */}
        {Object.keys(generatedDocs).length > 0 && (
          <div className="px-4 py-3 border-t border-border/50">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(generatedDocs).map(([id, doc]) => (
                <div key={id} className="flex gap-1">
                  <button
                    onClick={() => handleDownloadDoc(id, doc.content, 'docx')}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-colors"
                  >
                    <Download className="w-3 h-3" /> {id}.docx
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(id, doc.content, 'xlsx')}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-colors"
                  >
                    <Download className="w-3 h-3" /> .xlsx
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input — floating bar like Claude/Gemini */}
        <div className="px-4 pt-2 pb-6">
          <div className="relative bg-muted/40 border border-border/60 rounded-2xl focus-within:border-border focus-within:bg-muted/60 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 px-4 pt-3.5 pb-12 rounded-2xl focus:outline-none min-h-[52px] max-h-[200px]"
              rows={1}
            />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={!chatReady || !input.trim() || isRequestInFlight}
                className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 active:scale-95 transition-all"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
