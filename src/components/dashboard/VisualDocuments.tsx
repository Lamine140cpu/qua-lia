import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Download, Eye, FileText } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { sanitizeHtml } from '@/lib/sanitize';
import { EDGE_FN } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VisualDocumentsProps {
  cfaInfo: any;
  formations: any[];
  organisation: any;
}

const VISUAL_TYPES = [
  { type: 'Programme de formation', prompt: 'Génère un programme de formation complet et détaillé pour la première formation du CFA, avec modules, durées, objectifs pédagogiques, modalités d\'évaluation, prérequis et planning.' },
  { type: 'Organigramme', prompt: 'Génère l\'organigramme complet du CFA avec la direction, les responsables pédagogiques, les formateurs, le référent handicap, l\'administration.' },
  { type: 'Livret d\'accueil', prompt: 'Génère un livret d\'accueil complet pour les apprenants : présentation du CFA, règlement intérieur résumé, contacts, plan d\'accès, moyens pédagogiques, référent handicap.' },
  { type: 'Tableau de bord qualité', prompt: 'Génère un tableau de bord qualité avec indicateurs de performance : taux de réussite, satisfaction, insertion professionnelle, abandon, avec données chiffrées réalistes.' },
  { type: 'Planning type', prompt: 'Génère un planning type hebdomadaire de formation avec les créneaux, modules, formateurs, salles.' },
  { type: 'Fiche de poste formateur', prompt: 'Génère une fiche de poste complète pour un formateur du CFA : missions, compétences, rattachement, conditions.' },
];

export function VisualDocuments({ cfaInfo, formations, organisation }: VisualDocumentsProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [visualType, setVisualType] = useState('');

  const generateVisual = useCallback(async (type: string, prompt: string) => {
    setVisualType(type);
    setLoading(true);
    setModalOpen(true);
    setHtml('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const resp = await fetch(EDGE_FN.generateVisual, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, prompt, cfaInfo, formations, organisation }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(data.error || `Erreur ${resp.status}`);
      }
      const data = await resp.json();
      setHtml(data.html);
    } catch (err: any) {
      toast({ title: 'Erreur génération visuelle', description: err.message, variant: 'destructive' });
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }, [cfaInfo, formations, organisation, toast]);

  const handleDownloadHtml = () => {
    const blob = new Blob([`<html><body>${html}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${visualType.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${visualType}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: #1e3a5f; color: #fff; padding: 8px; text-align: left; font-size: 10pt; }
    td { padding: 6px 8px; border: 1px solid #d1d5db; font-size: 10pt; }
    tr:nth-child(even) td { background: #f8fafc; }
    h1 { font-size: 18pt; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 6px; margin-top: 0; }
    h2 { font-size: 13pt; color: #1e3a5f; margin-top: 18px; }
    h3 { font-size: 11pt; color: #374151; }
    .header-bar { background: #1e3a5f; color: white; padding: 12px 16px; margin-bottom: 20px; }
    .footer { margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 8px; font-size: 9pt; color: #6b7280; text-align: center; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <strong>${visualType}</strong> — ${cfaInfo?.nom || '[Nom de l\'organisme]'}
  </div>
  ${html}
  <div class="footer">
    Document généré par Qualia · ${new Date().toLocaleDateString('fr-FR')} · ${cfaInfo?.nom || ''}
  </div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({
        title: 'Popup bloquée',
        description: 'Autorisez les popups pour ce site, puis réessayez.',
        variant: 'destructive',
      });
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleDownloadDocx = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/export-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: html, filename: visualType.replace(/\s+/g, '_') }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(err.error || `Erreur ${resp.status}`);
      }
      const arrayBuf = await resp.arrayBuffer();
      if (arrayBuf.byteLength === 0) throw new Error('Fichier vide reçu');
      const url = URL.createObjectURL(new Blob([arrayBuf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${visualType.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: 'Erreur export DOCX', description: e.message || 'Serveur injoignable', variant: 'destructive' });
    }
  };

  return (
    <>
      <ScrollReveal>
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Documents visuels</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Générez des documents visuels professionnels pour votre CFA.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_TYPES.map(({ type, prompt }) => (
              <Card
                key={type}
                className="cursor-pointer hover:shadow-md transition-shadow border hover:border-primary/30"
                onClick={() => generateVisual(type, prompt)}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{type}</p>
                    <p className="text-xs text-muted-foreground">Cliquez pour générer</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {visualType}
            </DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Génération en cours...</span>
            </div>
          ) : (
            <div>
              <div
                className="border rounded-lg p-6 bg-white text-black overflow-auto"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={handleDownloadHtml} className="gap-1">
                  <Download className="w-3 h-3" /> HTML
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadDocx} className="gap-1">
                  <Download className="w-3 h-3" /> DOCX
                </Button>
                <Button size="sm" onClick={handleDownloadPdf} className="gap-1 bg-primary hover:bg-primary/90 text-white">
                  <FileText className="w-3 h-3" /> Télécharger PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
