import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Shield, Crown, ArrowRight } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { motion } from 'framer-motion';

export default function Pricing() {
  const { currentPlanId, fetchPlans, checkout, loading, checkoutError } = useSubscriptionStore();

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Navbar />

      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
            Votre mallette Qualiopi, <span className="text-blue-700">prête pour l'audit</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Testez gratuitement avec le Critère 1, puis obtenez le dossier complet.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="h-full flex flex-col border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-lg text-slate-900">Découverte</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-slate-900">Gratuit</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Pour découvrir la qualité de nos documents</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {[
                    'Critère 1 complet (3 indicateurs)',
                    'Documents générés prêts pour l\'audit',
                    'Export DOCX',
                    'Chat consultant IA (critère 1)',
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  disabled={currentPlanId === 'gratuit'}
                >
                  {currentPlanId === 'gratuit' ? 'Plan actuel' : 'Inclus'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Complete plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full flex flex-col border-blue-600 ring-2 ring-blue-100 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs font-bold px-4 py-1 rounded-full">
                Recommandé
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-blue-700" />
                  <CardTitle className="text-lg text-slate-900">Dossier Complet</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-slate-900">699<span className="text-lg">€</span></span>
                  <span className="text-slate-500 ml-2 text-sm">paiement unique</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">Tout ce qu'il faut pour réussir votre audit</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {[
                    '32 indicateurs — 7 critères complets',
                    'Générations illimitées de documents',
                    '3 pré-audits IA offerts (valeur 87€)',
                    'Export mallette complète DOCX + ZIP',
                    'Mode amélioration des documents',
                    'Génération d\'images professionnelles',
                    'Chat consultant expert illimité',
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6 bg-blue-700 hover:bg-blue-800 gap-2"
                  onClick={() => checkout('complet')}
                  disabled={loading || currentPlanId === 'complet'}
                >
                  {currentPlanId === 'complet' ? 'Déjà acheté' : loading ? 'Redirection vers Stripe...' : <>Obtenir le dossier <ArrowRight className="w-4 h-4" /></>}
                </Button>
                {checkoutError && (
                  <p className="text-sm text-red-600 mt-2 text-center">{checkoutError}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pre-audit add-on */}
        <div className="mt-10 max-w-4xl mx-auto">
          <Card className="border-slate-200 bg-slate-50/50">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <p className="font-semibold text-slate-900">Pré-audit supplémentaire</p>
                <p className="text-sm text-slate-500">Analyse complète par IA Opus — conformité, risques, plan d'actions</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-slate-900">29€</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkout('preaudit')}
                  disabled={loading || currentPlanId !== 'complet'}
                >
                  Acheter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center text-sm text-slate-400">
          <p>Paiement sécurisé par Stripe. Accès immédiat après paiement.</p>
        </div>
      </div>
    </div>
  );
}
