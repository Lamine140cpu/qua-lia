import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import type { AuditResult } from '@/lib/api';

interface AuditSectionProps {
  generatedCount: number;
  auditResult: AuditResult | null;
  auditLoading: boolean;
  auditError: string | null;
  onAudit: () => void;
}

export function AuditSection({ generatedCount, auditResult, auditLoading, auditError, onAudit }: AuditSectionProps) {
  if (generatedCount === 0) return null;

  return (
    <ScrollReveal>
      <div className="mt-8">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Pré-audit IA</span>
            </div>
            <Button
              size="sm"
              onClick={onAudit}
              disabled={auditLoading}
              className="gap-1 active:scale-[0.97] transition-transform"
            >
              {auditLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Audit en cours...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> Lancer le pré-audit ({generatedCount} docs)
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {auditError && (
              <p className="text-sm text-destructive">{auditError}</p>
            )}
            {auditResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`text-2xl font-bold tabular-nums ${
                      auditResult.overall_score === 'conforme'
                        ? 'text-[hsl(145,50%,36%)]'
                        : auditResult.overall_score === 'partiellement_conforme'
                          ? 'text-[hsl(45,75%,48%)]'
                          : 'text-destructive'
                    }`}
                  >
                    {auditResult.overall_percentage}%
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {auditResult.overall_score === 'conforme'
                        ? 'Conforme'
                        : auditResult.overall_score === 'partiellement_conforme'
                          ? 'Partiellement conforme'
                          : 'Non conforme'}
                    </p>
                    <p className="text-xs text-muted-foreground">{auditResult.overall_summary}</p>
                  </div>
                </div>

                {auditResult.criteria.map((c) => (
                  <div key={c.critere_id} className="rounded-lg border p-3">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      {c.critere_titre}
                      <span
                        className={`ml-2 ${
                          c.score === 'conforme'
                            ? 'text-[hsl(145,50%,36%)]'
                            : c.score === 'partiellement_conforme'
                              ? 'text-[hsl(45,75%,48%)]'
                              : 'text-destructive'
                        }`}
                      >
                        {c.score === 'conforme' ? '\u2713' : c.score === 'partiellement_conforme' ? '~' : '\u2717'}
                      </span>
                    </p>
                    <div className="space-y-1">
                      {c.indicateurs.map((ind) => (
                        <div key={ind.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {ind.id} — {ind.titre}
                          </span>
                          <span
                            className={`font-medium ${
                              ind.score === 'conforme'
                                ? 'text-[hsl(145,50%,36%)]'
                                : ind.score === 'partiellement_conforme'
                                  ? 'text-[hsl(45,75%,48%)]'
                                  : 'text-destructive'
                            }`}
                          >
                            {ind.score_num}/3
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {auditResult.priority_actions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Actions prioritaires :</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {auditResult.priority_actions.map((action, i) => (
                        <li key={i}>&bull; {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!auditResult && !auditError && !auditLoading && (
              <p className="text-sm text-muted-foreground">
                Lancez un pré-audit pour évaluer la conformité de vos documents au RNQ v9.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollReveal>
  );
}
