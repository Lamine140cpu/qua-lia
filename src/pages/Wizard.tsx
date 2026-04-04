import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '@/stores/wizard-store';
import { Navbar } from '@/components/Navbar';
import { RNQ_V9, getAllIndicateurs, indicateurAppliesToTypes, getIndicateurTypeNote, type TypeAction } from '@/data/rnq-v9';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';

const STEPS = [
  'Type d\'organisme',
  'Informations',
  'Prestations',
  'Organisation',
  'Indicateurs',
] as const;

const TYPES_ACTIONS: { id: TypeAction; label: string; desc: string; emoji: string }[] = [
  { id: 'of', label: 'Actions de formation', desc: 'Organisme de formation proposant des stages, sessions, e-learning…', emoji: '🎓' },
  { id: 'bc', label: 'Bilans de compétences', desc: 'Accompagnement individuel pour faire le point sur les compétences professionnelles.', emoji: '🔍' },
  { id: 'vae', label: 'VAE', desc: 'Validation des Acquis de l\'Expérience — accompagnement à la certification.', emoji: '📋' },
  { id: 'cfa', label: 'Apprentissage (CFA)', desc: 'Centre de Formation d\'Apprentis — formations en alternance.', emoji: '🏭' },
];

/** Terminologie adaptée selon les types d'actions sélectionnés */
export function getTerminologie(typesActions: TypeAction[]) {
  if (typesActions.includes('bc') && typesActions.length === 1) {
    return { organisme: 'Cabinet de bilan', apprenants: 'bénéficiaires', formations: 'bilans de compétences', formateurs: 'consultants / psychologues du travail' };
  }
  if (typesActions.includes('vae') && typesActions.length === 1) {
    return { organisme: 'Organisme VAE', apprenants: 'candidats', formations: 'accompagnements VAE', formateurs: 'accompagnateurs VAE' };
  }
  if (typesActions.includes('cfa') && !typesActions.includes('of')) {
    return { organisme: 'CFA', apprenants: 'apprentis', formations: 'formations en alternance', formateurs: 'formateurs / maîtres d\'apprentissage' };
  }
  return { organisme: 'Organisme de formation', apprenants: 'apprenants / stagiaires', formations: 'formations', formateurs: 'formateurs' };
}

/** Validate that required wizard fields are filled */
function getWizardErrors(store: ReturnType<typeof useWizardStore.getState>) {
  const errors: string[] = [];
  if (store.cfaInfo.typesActions.length === 0) errors.push('Type d\'organisme');
  if (!store.cfaInfo.nom.trim()) errors.push('Nom de l\'organisme');
  if (!store.cfaInfo.siret.trim()) errors.push('SIRET');
  if (!store.cfaInfo.responsable.trim()) errors.push('Responsable');
  if (!store.cfaInfo.email.trim()) errors.push('Email');
  if (!store.cfaInfo.adresse.trim()) errors.push('Adresse');
  if (!store.cfaInfo.ville.trim()) errors.push('Ville');
  if (!store.cfaInfo.codePostal.trim()) errors.push('Code postal');
  if (!store.cfaInfo.telephone.trim()) errors.push('Téléphone');
  if (store.formations.length === 0) errors.push('Au moins 1 prestation');
  else if (store.formations.some(f => !f.intitule.trim())) errors.push('Intitulé de chaque prestation');
  if (store.cfaInfo.typesActions.includes('cfa') && !store.organisation.referentHandicap.trim()) errors.push('Référent handicap');
  return errors;
}

export default function Wizard() {
  const { currentStep, setCurrentStep } = useWizardStore();
  const store = useWizardStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const wizardErrors = getWizardErrors(store);
  const isWizardValid = wizardErrors.length === 0;

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finish = () => {
    if (!isWizardValid) {
      toast({
        title: 'Champs obligatoires manquants',
        description: wizardErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }
    if (store.selectedIndicateurs.length === 0) {
      const typesActions = store.cfaInfo.typesActions as TypeAction[];
      store.setSelectedIndicateurs(
        getAllIndicateurs()
          .filter(i => indicateurAppliesToTypes(i.id, typesActions))
          .map(i => i.id)
      );
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        rightContent={
          <span className="text-sm text-muted-foreground">
            Étape {currentStep + 1}/{STEPS.length}
          </span>
        }
      />

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Progress value={progress} className="mb-8 h-2" />
        <div className="mb-2 flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setCurrentStep(i)}
              className={`text-xs font-medium transition-colors ${i === currentStep ? 'text-primary' : i < currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {i < currentStep ? <Check className="inline w-3 h-3 mr-0.5" /> : null}{s}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentStep === 0 && <StepTypeOrganisme />}
            {currentStep === 1 && <StepCfaInfo />}
            {currentStep === 2 && <StepFormations />}
            {currentStep === 3 && <StepOrganisation />}
            {currentStep === 4 && <StepIndicateurs />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={prev} disabled={currentStep === 0} className="gap-1 active:scale-[0.97] transition-transform">
            <ArrowLeft className="w-4 h-4" /> Précédent
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={next} className="gap-1 active:scale-[0.97] transition-transform">
              Suivant <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {!isWizardValid && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {wizardErrors.length} champ(s) requis
                </span>
              )}
              <Button onClick={finish} className="gap-1 active:scale-[0.97] transition-transform">
                Générer mon kit <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepTypeOrganisme() {
  const { cfaInfo, setCfaInfo } = useWizardStore();
  const selected = cfaInfo.typesActions || [];
  const auditStatus = cfaInfo.auditStatus || 'initial';

  const toggle = (id: TypeAction) => {
    const next = selected.includes(id)
      ? selected.filter(t => t !== id)
      : [...selected, id];
    setCfaInfo({ typesActions: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quel type de certification Qualiopi visez-vous ?</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Sélectionnez un ou plusieurs types d'actions. Les documents générés s'adapteront automatiquement.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {TYPES_ACTIONS.map(t => {
            const isSelected = selected.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <span className="text-2xl mt-0.5">{t.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.desc}</p>
                </div>
                {isSelected && <Check className="ml-auto w-4 h-4 text-primary shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-foreground mb-3">Situation vis-à-vis de Qualiopi</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: 'initial' as const, label: 'Audit initial (nouvel entrant)', desc: 'Première certification Qualiopi — pas encore certifié.', emoji: '🆕' },
              { id: 'renouvellement' as const, label: 'Renouvellement', desc: 'Déjà certifié — audit de surveillance ou renouvellement.', emoji: '🔄' },
            ].map(opt => {
              const isSelected = auditStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCfaInfo({ auditStatus: opt.id })}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <span className="text-2xl mt-0.5">{opt.emoji}</span>
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                  {isSelected && <Check className="ml-auto w-4 h-4 text-primary shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
          {auditStatus === 'renouvellement' && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> En renouvellement, l'auditeur attend des preuves d'amélioration continue depuis le dernier audit.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StepCfaInfo() {
  const { cfaInfo, setCfaInfo } = useWizardStore();
  const terminologie = getTerminologie(cfaInfo.typesActions || []);
  const hasCfa = cfaInfo.typesActions?.includes('cfa');

  const fields: { key: keyof typeof cfaInfo; label: string; placeholder: string; type?: string; hidden?: boolean }[] = [
    { key: 'nom', label: `Nom de l'organisme`, placeholder: terminologie.organisme },
    { key: 'siret', label: 'SIRET', placeholder: '123 456 789 00012' },
    { key: 'responsable', label: 'Responsable / Directeur', placeholder: 'Marie Lefèvre' },
    { key: 'email', label: 'Email de contact', placeholder: 'contact@organisme.fr', type: 'email' },
    { key: 'telephone', label: 'Téléphone', placeholder: '01 23 45 67 89', type: 'tel' },
    { key: 'adresse', label: 'Adresse', placeholder: '12 rue de la Formation' },
    { key: 'codePostal', label: 'Code postal', placeholder: '75001' },
    { key: 'ville', label: 'Ville', placeholder: 'Paris' },
    { key: 'siteWeb', label: 'Site web', placeholder: 'https://www.organisme.fr' },
    { key: 'nda', label: 'Numéro de déclaration d\'activité (NDA)', placeholder: '11 75 12345 75' },
    { key: 'uai', label: 'Numéro UAI (CFA uniquement, optionnel)', placeholder: '0123456A', hidden: !hasCfa },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de votre organisme</CardTitle>
        {cfaInfo.typesActions?.length > 0 && (
          <p className="text-xs text-primary font-medium mt-1">
            {cfaInfo.typesActions.map(t => TYPES_ACTIONS.find(x => x.id === t)?.label).join(' · ')}
          </p>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {fields.filter(f => !f.hidden).map(f => (
          <div key={f.key} className={f.key === 'adresse' || f.key === 'nom' ? 'sm:col-span-2' : ''}>
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={cfaInfo[f.key as keyof typeof cfaInfo] as string}
              onChange={e => setCfaInfo({ [f.key]: e.target.value })}
              className="mt-1"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StepFormations() {
  const { formations, addFormation, removeFormation, updateFormation, cfaInfo } = useWizardStore();
  const terminologie = getTerminologie(cfaInfo.typesActions || []);
  const isBc = cfaInfo.typesActions?.includes('bc') && cfaInfo.typesActions.length === 1;
  const isVae = cfaInfo.typesActions?.includes('vae') && cfaInfo.typesActions.length === 1;

  const add = () => {
    addFormation({ id: crypto.randomUUID(), intitule: '', rncp: '', niveau: '', duree: '', publics: [] });
  };

  const labelPrestation = isBc ? 'Bilan' : isVae ? 'Accompagnement VAE' : 'Formation';
  const placeholderIntitule = isBc ? 'Bilan de compétences individuel 24h' : isVae ? 'Accompagnement VAE — BTS MUC' : 'BTS Comptabilité et Gestion';

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{terminologie.formations.charAt(0).toUpperCase() + terminologie.formations.slice(1)} proposées</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Les {terminologie.formations} seront mentionnées dans tous les documents générés.</p>
        </div>
        <Button variant="outline" size="sm" onClick={add} className="gap-1 shrink-0">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {formations.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune prestation ajoutée. Cliquez sur « Ajouter » pour commencer.</p>
        )}
        {formations.map((f, i) => (
          <div key={f.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{labelPrestation} {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeFormation(f.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Intitulé</Label>
                <Input value={f.intitule} onChange={e => updateFormation(f.id, { intitule: e.target.value })} placeholder={placeholderIntitule} className="mt-1" />
              </div>
              {!isBc && (
                <div>
                  <Label>Code RNCP {isVae ? '' : '(optionnel)'}</Label>
                  <Input value={f.rncp} onChange={e => updateFormation(f.id, { rncp: e.target.value })} placeholder="RNCP38362" className="mt-1" />
                </div>
              )}
              {!isBc && !isVae && (
                <div>
                  <Label>Niveau</Label>
                  <Input value={f.niveau} onChange={e => updateFormation(f.id, { niveau: e.target.value })} placeholder="Niveau 5 (Bac+2)" className="mt-1" />
                </div>
              )}
              <div>
                <Label>Durée</Label>
                <Input value={f.duree} onChange={e => updateFormation(f.id, { duree: e.target.value })} placeholder={isBc ? '24 heures' : '24 mois'} className="mt-1" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StepOrganisation() {
  const { organisation, setOrganisation, cfaInfo } = useWizardStore();
  const terminologie = getTerminologie(cfaInfo.typesActions || []);
  const hasCfa = cfaInfo.typesActions?.includes('cfa');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation & moyens</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Référent handicap{!hasCfa && <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>}</Label>
          <Input value={organisation.referentHandicap} onChange={e => setOrganisation({ referentHandicap: e.target.value })} placeholder="Jean Dupont" className="mt-1" />
        </div>
        <div>
          <Label>Email référent handicap</Label>
          <Input type="email" value={organisation.referentHandicapEmail} onChange={e => setOrganisation({ referentHandicapEmail: e.target.value })} placeholder={`handicap@organisme.fr`} className="mt-1" />
        </div>
        <div>
          <Label>Effectif {terminologie.formateurs}</Label>
          <Input type="number" min={1} value={organisation.effectifFormateurs} onChange={e => setOrganisation({ effectifFormateurs: parseInt(e.target.value) || 1 })} className="mt-1" />
        </div>
        <div>
          <Label>Plateforme LMS</Label>
          <Input value={organisation.plateformeLMS} onChange={e => setOrganisation({ plateformeLMS: e.target.value })} placeholder="Moodle, 360Learning..." className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label>Description des locaux</Label>
          <Input value={organisation.locaux} onChange={e => setOrganisation({ locaux: e.target.value })} placeholder="3 salles de cours, 1 salle informatique (20 postes), 1 CDI..." className="mt-1" />
        </div>
        <div className="sm:col-span-2 pt-4 border-t">
          <FileUpload label="Documents existants & logo (optionnel)" />
        </div>
      </CardContent>
    </Card>
  );
}

function StepIndicateurs() {
  const { selectedIndicateurs, toggleIndicateur, setSelectedIndicateurs, cfaInfo, collectedPreuves, setPreuveCollected } = useWizardStore();
  const typesActions = (cfaInfo.typesActions || []) as TypeAction[];
  const applicableIds = getAllIndicateurs().filter(i => indicateurAppliesToTypes(i.id, typesActions)).map(i => i.id);
  const allApplicableSelected = applicableIds.every(id => selectedIndicateurs.includes(id));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Sélection des indicateurs</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Les indicateurs cochés seront traités par l'agent IA. Les preuves dynamiques (📋) sont à collecter manuellement.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedIndicateurs(allApplicableSelected ? [] : applicableIds)}
        >
          {allApplicableSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(RNQ_V9).map(([key, critere], ci) => (
          <div key={key}>
            <p className="mb-2 text-sm font-semibold text-foreground">
              Critère {ci + 1} — {critere.titre}
            </p>
            <div className="space-y-2">
              {Object.entries(critere.indicateurs).map(([id, ind]) => {
                const applicable = indicateurAppliesToTypes(id, typesActions);
                const typeNote = getIndicateurTypeNote(id);
                const isSelected = selectedIndicateurs.includes(id);
                const dynamicProofs = ind.preuves.filter(p => p.dynamic);
                const collected = collectedPreuves[id] || [];
                const collectedCount = collected.filter(c => c.collected).length;

                return (
                  <div key={id} className={`rounded-md border transition-colors ${applicable ? '' : 'opacity-40 bg-muted/20'}`}>
                    <label className={`flex items-start gap-3 p-3 ${applicable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed'}`}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => applicable && toggleIndicateur(id)}
                        disabled={!applicable}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{id}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{ind.titre}</span>
                        {!applicable && typeNote && (
                          <span className="ml-2 text-xs text-orange-500">({typeNote})</span>
                        )}
                        {applicable && dynamicProofs.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            📋 {collectedCount}/{dynamicProofs.length} preuves collectées
                          </span>
                        )}
                      </div>
                    </label>
                    {/* Show dynamic proofs checklist if selected */}
                    {isSelected && applicable && dynamicProofs.length > 0 && (
                      <div className="border-t px-3 py-2 bg-muted/20 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Preuves à collecter :</p>
                        {dynamicProofs.map(p => {
                          const isCollected = collected.find(c => c.preuveId === p.id)?.collected || false;
                          return (
                            <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1 py-0.5">
                              <Checkbox
                                checked={isCollected}
                                onCheckedChange={(checked) => setPreuveCollected(id, p.id, !!checked)}
                                className="h-3.5 w-3.5"
                              />
                              <span className={isCollected ? 'text-foreground line-through opacity-60' : 'text-muted-foreground'}>
                                {p.label}
                              </span>
                              {p.description && (
                                <span className="text-muted-foreground/60 ml-1">— {p.description}</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
