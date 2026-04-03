import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Navbar } from '@/components/Navbar';
import { useWizardStore } from '@/stores/wizard-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useChatStore } from '@/stores/chat-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { RNQ_V9, CRITERE_COLORS, indicateurAppliesToTypes, type TypeAction } from '@/data/rnq-v9';
import { requestAudit, validateDocuments, exportMallette, improveDocument, type ValidationResult } from '@/lib/api';
import { useNotificationStore } from '@/stores/notification-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  CheckCircle2, AlertCircle, Loader2, PackageCheck,
  ArrowLeft, Download, MessageSquare, FileText,
  Sparkles, History, Archive, AlertTriangle, Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


// Extracted sub-components
import { AuditSection } from '@/components/dashboard/AuditSection';
import { VisualDocuments } from '@/components/dashboard/VisualDocuments';
import { ImproveModal } from '@/components/dashboard/ImproveModal';
import { VersionHistoryModal } from '@/components/dashboard/VersionHistoryModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cfaInfo, formations, organisation } = useWizardStore();
  const { documents, setDocStatus, auditResult, auditLoading, auditError, setAuditResult, setAuditLoading, setAuditError, cleanupStuckGenerating, restoreVersion } = useDashboardStore();
  const { conversations } = useChatStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { currentPlanId, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    cleanupStuckGenerating();
    fetchSubscription();
  }, [cleanupStuckGenerating, fetchSubscription]);

  const staleCount = Object.values(documents).filter((d) => d.stale).length;

  // ── Validation ──
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // ── Improve ──
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const [improveModalOpen, setImproveModalOpen] = useState(false);
  const [improveText, setImproveText] = useState('');
  const [improveTargetId, setImproveTargetId] = useState('');

  // ── Version history ──
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionDocId, setVersionDocId] = useState('');

  // ── Export ──
  const [exporting, setExporting] = useState(false);

  const handleValidate = useCallback(async () => {
    setValidating(true);
    try {
      const result = await validateDocuments({ documents, cfaInfo });
      setValidationResult(result);
      if (result.valid) {
        toast({ title: 'Documents valides', description: 'Aucun placeholder ni incohérence détecté.' });
        addNotification({ type: 'success', title: 'Validation réussie', description: `${Object.keys(documents).length} documents vérifiés sans problème.` });
      } else {
        toast({ title: `${result.issueCount} problème(s) détecté(s)`, description: 'Consultez le détail ci-dessous.', variant: 'destructive' });
        addNotification({ type: 'warning', title: `Validation : ${result.issueCount} problème(s)`, description: result.issues.slice(0, 3).map(i => i.message).join(', ') });
      }
    } catch (err: any) {
      toast({ title: 'Erreur de validation', description: err.message, variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  }, [documents, cfaInfo, toast, addNotification]);

  const handleExportMallette = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportMallette({ documents, cfaInfo });
      if (blob.size === 0) throw new Error('Fichier vide');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mallette_Qualiopi_${cfaInfo.nom || 'Organisme'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Mallette exportée' });
      addNotification({ type: 'success', title: 'Mallette exportée', description: `${Object.values(documents).filter(d => d.status === 'generated').length} documents combinés.` });
    } catch (err: any) {
      toast({ title: 'Erreur export mallette', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }, [documents, cfaInfo, toast, addNotification]);

  const handleImprove = useCallback(async (indicateurId: string) => {
    const doc = documents[indicateurId];
    if (!doc?.content) return;
    setImprovingId(indicateurId);
    setImproveTargetId(indicateurId);
    setImproveText('');
    setImproveModalOpen(true);

    try {
      setDocStatus(indicateurId, 'generating', { generatedAt: new Date().toISOString() });
      const fullText = await improveDocument(
        { indicateurId, existingContent: doc.content, cfaInfo, formations, organisation },
        (delta) => setImproveText((prev) => prev + delta),
      );
      setDocStatus(indicateurId, 'generated', { content: fullText, generatedAt: new Date().toISOString(), improvedFrom: doc.content });
      addNotification({ type: 'success', title: `${indicateurId} amélioré`, indicateurId });
    } catch (err: any) {
      setDocStatus(indicateurId, 'generated', { content: doc.content });
      toast({ title: 'Erreur amélioration', description: err.message, variant: 'destructive' });
    } finally {
      setImprovingId(null);
    }
  }, [documents, cfaInfo, formations, organisation, setDocStatus, toast, addNotification]);

  const handleRestoreVersion = useCallback((docId: string, versionNum: number) => {
    restoreVersion(docId, versionNum);
    toast({ title: `Version ${versionNum} restaurée pour ${docId}` });
    addNotification({ type: 'info', title: 'Version restaurée', description: `${docId} — version ${versionNum}`, indicateurId: docId });
    setVersionModalOpen(false);
  }, [restoreVersion, toast, addNotification]);

  const handleAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const result = await requestAudit({
        documents,
        cfaInfo,
        selectedIndicateurs: Object.keys(documents).filter((id) => documents[id]?.status === 'generated'),
      });
      setAuditResult(result);
      toast({ title: 'Pré-audit terminé' });
    } catch (err: any) {
      setAuditError(err.message);
      toast({ title: 'Erreur de pré-audit', description: err.message, variant: 'destructive' });
    }
  }, [documents, cfaInfo, setAuditLoading, setAuditError, setAuditResult, toast]);

  const handleDownloadDocx = async (indicateurId: string) => {
    const doc = documents[indicateurId];
    if (!doc?.content) return;
    const filename = `${indicateurId}_${cfaInfo.nom || 'CFA'}`;
    try {
      const { exportSingleDocx } = await import('@/lib/api');
      const blob = await exportSingleDocx({ markdown: doc.content, filename, cfaInfo });
      if (blob.size === 0) throw new Error('Fichier vide reçu');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: 'Erreur export DOCX', description: e.message || 'Serveur injoignable', variant: 'destructive' });
    }
  };

  const generatedCount = Object.values(documents).filter((d) => d.status === 'generated').length;
  const wizardIncomplete = !cfaInfo.nom.trim() || !cfaInfo.siret.trim() || formations.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        rightContent={
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{cfaInfo.nom || 'Mon CFA'}</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/wizard')} className="gap-1">
              <ArrowLeft className="w-3 h-3" /> Modifier
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-10">
        <ScrollReveal>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="mt-2 text-muted-foreground">
            Cliquez sur un critère pour démarrer la conversation avec l'agent Qualiopi.
          </p>
        </ScrollReveal>

        {/* Wizard incomplete warning */}
        {wizardIncomplete && (
          <ScrollReveal>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Informations CFA incomplètes</p>
                <p className="text-xs text-muted-foreground">
                  Remplissez au minimum le nom, SIRET et ajoutez une formation pour éviter que l'IA invente des données.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/wizard')} className="gap-1 shrink-0">
                Compléter
              </Button>
            </div>
          </ScrollReveal>
        )}

        {/* Stale documents warning */}
        {staleCount > 0 && (
          <ScrollReveal>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-[hsl(45,75%,48%)]/40 bg-[hsl(45,75%,48%)]/10 p-3">
              <AlertCircle className="w-5 h-5 text-[hsl(45,75%,48%)] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{staleCount} document(s) obsolète(s)</p>
                <p className="text-xs text-muted-foreground">
                  Vos données CFA ont changé depuis la dernière génération. Régénérez les documents concernés.
                </p>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Criteria cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(RNQ_V9).map(([key, critere], ci) => {
            const critereNum = key.replace('critere', '');
            const accentColor = CRITERE_COLORS[key as keyof typeof CRITERE_COLORS] || '216 72% 30%';
            const typesActions = (cfaInfo.typesActions || []) as TypeAction[];
            const indicateurIds = Object.keys(critere.indicateurs);
            const applicableIds = indicateurIds.filter(id => indicateurAppliesToTypes(id, typesActions));
            const generatedForCritere = applicableIds.filter((id) => documents[id]?.status === 'generated').length;
            const pct = applicableIds.length > 0 ? Math.round((generatedForCritere / applicableIds.length) * 100) : 0;
            const skippedCount = indicateurIds.length - applicableIds.length;
            const conv = conversations[key];
            const hasConversation = conv && conv.messages.length > 0;
            const isLocked = currentPlanId === 'gratuit' && key !== 'critere1';

            return (
              <ScrollReveal key={key} delay={ci * 0.06}>
                <motion.div whileHover={{ scale: isLocked ? 1.01 : 1.02 }} whileTap={{ scale: isLocked ? 0.99 : 0.98 }}>
                  <Card
                    className={`relative overflow-hidden transition-shadow border-2 ${isLocked ? 'cursor-default opacity-75 hover:shadow-sm' : 'cursor-pointer hover:shadow-lg hover:border-primary/30'}`}
                    onClick={() => isLocked ? navigate('/pricing') : navigate(`/agent/${key}`)}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: isLocked ? '#94a3b8' : `hsl(${accentColor})` }} />

                    {/* Lock overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px] rounded-lg">
                        <Lock className="w-7 h-7 text-muted-foreground mb-2" />
                        <p className="text-xs font-semibold text-foreground">Dossier Complet</p>
                        <p className="text-xs text-muted-foreground mt-0.5">699€ — paiement unique</p>
                        <Button size="sm" className="mt-3 text-xs h-7 px-3" onClick={(e) => { e.stopPropagation(); navigate('/pricing'); }}>
                          Débloquer
                        </Button>
                      </div>
                    )}

                    <CardHeader className="pb-2 pt-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-lg font-bold" style={{ backgroundColor: isLocked ? '#94a3b8' : `hsl(${accentColor})` }}>
                          {critereNum}
                        </span>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critère {critereNum}</span>
                          <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">{critere.titre}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{applicableIds.length} indicateur{applicableIds.length > 1 ? 's' : ''}{skippedCount > 0 ? ` (${skippedCount} n/a)` : ''}</span>
                        {generatedForCritere > 0 && (
                          <>
                            <span>&middot;</span>
                            <span className="text-[hsl(145,50%,36%)]">{generatedForCritere} doc(s) générés</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {hasConversation ? (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Conversation en cours
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Démarrer
                          </span>
                        )}
                        <Button size="sm" variant="outline" className="gap-1 text-xs pointer-events-none">
                          <MessageSquare className="w-3 h-3" /> {isLocked ? 'Verrouillé' : 'Ouvrir'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Global actions */}
        {generatedCount > 0 && (
          <ScrollReveal>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button onClick={handleValidate} disabled={validating} variant="outline" className="gap-1.5">
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                Valider les documents
              </Button>
              <Button onClick={handleExportMallette} disabled={exporting} variant="outline" className="gap-1.5">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                Exporter la mallette ({generatedCount} docs)
              </Button>
            </div>
          </ScrollReveal>
        )}

        {/* Validation results */}
        {validationResult && !validationResult.valid && (
          <ScrollReveal>
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-foreground">{validationResult.issueCount} problème(s) détecté(s)</span>
              </div>
              <div className="space-y-1.5">
                {validationResult.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 font-medium px-1.5 py-0.5 rounded ${
                      issue.type === 'placeholder' ? 'bg-destructive/10 text-destructive'
                        : issue.type === 'coherence' ? 'bg-[hsl(45,75%,48%)]/20 text-[hsl(45,75%,40%)]'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {issue.type === 'placeholder' ? 'Placeholder' : issue.type === 'coherence' ? 'Cohérence' : 'Incomplet'}
                    </span>
                    <span className="text-muted-foreground">{issue.indicateurId}</span>
                    <span className="text-foreground">{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Generated documents list */}
        {generatedCount > 0 && (
          <ScrollReveal>
            <div className="mt-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Documents générés ({generatedCount})</h2>
              <div className="grid gap-2">
                {Object.entries(documents)
                  .filter(([_, doc]) => doc.status === 'generated')
                  .map(([id, doc]) => (
                    <div key={id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${doc.stale ? 'text-[hsl(45,75%,48%)]' : 'text-[hsl(145,50%,36%)]'}`} />
                        <span className="text-sm font-semibold text-foreground">{id}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {doc.generatedAt ? new Date(doc.generatedAt).toLocaleDateString('fr-FR') : ''}
                        </span>
                        {doc.currentVersion && doc.currentVersion > 1 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">v{doc.currentVersion}</span>
                        )}
                        {doc.stale && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(45,75%,48%)]/20 text-[hsl(45,75%,40%)]">Obsolète</span>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleImprove(id)} disabled={improvingId === id} className="gap-1 text-xs" title="Améliorer avec l'IA">
                          {improvingId === id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        </Button>
                        {doc.versions && doc.versions.length > 0 && (
                          <Button size="sm" variant="ghost" onClick={() => { setVersionDocId(id); setVersionModalOpen(true); }} className="gap-1 text-xs" title="Historique des versions">
                            <History className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownloadDocx(id)} className="gap-1 text-xs">
                          <Download className="w-3 h-3" /> .docx
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Extracted components */}
        <ImproveModal
          open={improveModalOpen}
          onOpenChange={setImproveModalOpen}
          targetId={improveTargetId}
          improving={!!improvingId}
          text={improveText}
        />

        <VersionHistoryModal
          open={versionModalOpen}
          onOpenChange={setVersionModalOpen}
          docId={versionDocId}
          versions={documents[versionDocId]?.versions || []}
          onRestore={handleRestoreVersion}
        />

        <VisualDocuments cfaInfo={cfaInfo} formations={formations} organisation={organisation} />

        <AuditSection
          generatedCount={generatedCount}
          auditResult={auditResult}
          auditLoading={auditLoading}
          auditError={auditError}
          onAudit={handleAudit}
        />
      </div>
    </div>
  );
}
