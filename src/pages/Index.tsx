import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LogoMark } from '@/components/Logo';
import { RNQ_V9 } from '@/data/rnq-v9';
import { CRITERE_ICON_COMPONENTS, CRITERE_ACCENTS } from '@/data/critere-ui';
import { FileCheck, Clock, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const advantages = [
  { icon: <Clock className="w-7 h-7" />, title: "Gain de temps considérable", desc: "Générez l\u2019ensemble de votre documentation en quelques minutes au lieu de plusieurs semaines." },
  { icon: <ShieldCheck className="w-7 h-7" />, title: "Conformité RNQ v9", desc: "Chaque document est construit sur la base du Référentiel National Qualité de janvier 2024." },
  { icon: <Sparkles className="w-7 h-7" />, title: "Personnalisation par IA", desc: "L\u2019intelligence artificielle adapte chaque document à votre CFA, vos formations et votre contexte." },
  { icon: <FileCheck className="w-7 h-7" />, title: "Kit complet et téléchargeable", desc: "Obtenez des fichiers .docx prêts à l\u2019emploi pour les 32 indicateurs et 7 critères." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar
        rightContent={
          <Link to="/wizard">
            <Button size="sm" className="active:scale-[0.97] transition-transform">
              Commencer
            </Button>
          </Link>
        }
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24 md:py-36">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-blue-200 backdrop-blur-sm border border-white/10 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              RNQ v9 — Janvier 2024
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl" style={{ fontFamily: 'DM Sans' }}>
              Préparez votre audit Qualiopi en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">quelques clics</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Qual'IA génère votre mallette documentaire complète pour les 32 indicateurs. Documents prêts pour l'auditeur, personnalisés à votre CFA.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/wizard">
                <Button size="lg" className="gap-2 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.97] transition-transform font-semibold">
                  Essai gratuit — Critère 1
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm font-semibold active:scale-[0.97] transition-all">
                  Dossier complet — 699€
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">Paiement unique. Accès immédiat. Pas d'abonnement.</p>
          </motion.div>
        </div>
        {/* Floating logo mark — decorative right side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block"
        >
          <LogoMark size={320} />
        </motion.div>
        <div className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[80px]" />
      </section>

      {/* Stats bar */}
      <ScrollReveal>
        <section className="border-y bg-card">
          <div className="container mx-auto grid grid-cols-3 divide-x px-4 py-8 text-center">
            <div>
              <p className="text-3xl font-bold tabular-nums text-foreground">7</p>
              <p className="mt-1 text-sm text-muted-foreground">Critères</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-foreground">32</p>
              <p className="mt-1 text-sm text-muted-foreground">Indicateurs</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-foreground">60+</p>
              <p className="mt-1 text-sm text-muted-foreground">Documents générés</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Critères */}
      <section id="criteres" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Les 7 critères du RNQ v9
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Chaque critère est couvert par des indicateurs précis. Nous générons les preuves documentaires pour chacun.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(RNQ_V9).map(([key, critere], i) => {
              const count = Object.keys(critere.indicateurs).length;
              return (
                <ScrollReveal key={key} delay={i * 0.08}>
                  <div className="group relative rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg text-white ${CRITERE_ACCENTS[i]}`}>
                      {CRITERE_ICON_COMPONENTS[key]?.("w-6 h-6")}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Critère {i + 1}
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
                      {critere.titre}
                    </h3>
                    <p className="mt-3 text-sm tabular-nums text-muted-foreground">
                      {count} indicateur{count > 1 ? 's' : ''}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="border-t bg-muted/40 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Pourquoi Qual'IA ?
            </h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {advantages.map((adv, i) => (
              <ScrollReveal key={adv.title} delay={i * 0.1}>
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {adv.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{adv.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{adv.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal>
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Prêt à préparer votre audit ?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Complétez le formulaire en 4 étapes et téléchargez votre kit documentaire personnalisé.
            </p>
            <Link to="/wizard">
              <Button size="lg" className="mt-8 gap-2 active:scale-[0.97] transition-transform">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <Footer />
    </div>
  );
}
