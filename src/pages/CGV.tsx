import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function CGV() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground mb-6 block">&larr; Retour</button>
        <h1 className="text-3xl font-bold mb-8">Conditions Générales de Vente</h1>

        <section className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les ventes de services proposés par GROUPE AVERREO, SASU au capital de 100,00 €, dont le siège social est situé au 28 avenue des Pépinières, 94260 Fresnes, immatriculée au RCS de Créteil sous le numéro 944 316 207, via la plateforme Qual'IA accessible à l'adresse https://qualiopi-kit-builder-480451254262.europe-west1.run.app.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 2 — Services proposés</h2>
            <p>Qual'IA propose les services suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Offre Découverte (gratuite) :</strong> accès au Critère 1 du référentiel RNQ v9 avec génération de documents assistée par IA.</li>
              <li><strong>Dossier Complet (699 € TTC, paiement unique) :</strong> accès à l'ensemble des 7 critères et 32 indicateurs, génération illimitée de documents, export DOCX et ZIP, 3 pré-audits IA inclus, mode amélioration et génération de visuels.</li>
              <li><strong>Pré-audit supplémentaire (29 € TTC, paiement unique) :</strong> un pré-audit IA additionnel.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 3 — Prix et paiement</h2>
            <p>
              Les prix sont indiqués en euros TTC. Le paiement s'effectue en ligne par carte bancaire via la plateforme sécurisée Stripe. Le paiement est unique (pas d'abonnement). L'accès aux services est immédiat après confirmation du paiement.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 4 — Droit de rétractation</h2>
            <p>
              Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé avec l'accord préalable exprès du consommateur.
            </p>
            <p>
              En accédant immédiatement aux services après paiement, l'utilisateur reconnaît renoncer expressément à son droit de rétractation.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 5 — Accès au service</h2>
            <p>
              L'accès à Qual'IA nécessite la création d'un compte utilisateur. GROUPE AVERREO s'engage à assurer la disponibilité du service dans la mesure du possible mais ne garantit pas un accès ininterrompu. Des interruptions pour maintenance ou mise à jour peuvent survenir.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 6 — Limitation de responsabilité</h2>
            <p>
              Les documents générés par Qual'IA constituent une aide à la préparation de la certification Qualiopi. GROUPE AVERREO ne garantit pas l'obtention de la certification. Les documents doivent être vérifiés et adaptés par l'utilisateur avant toute utilisation dans le cadre d'un audit.
            </p>
            <p>
              GROUPE AVERREO ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation du service, y compris en cas de non-obtention de la certification Qualiopi.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 7 — Propriété intellectuelle</h2>
            <p>
              Les documents générés par l'utilisateur via Qual'IA restent la propriété de l'utilisateur. La plateforme Qual'IA, son code source, son design et ses contenus demeurent la propriété exclusive de GROUPE AVERREO.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 8 — Protection des données</h2>
            <p>
              Les données personnelles collectées sont traitées conformément à notre <button onClick={() => navigate('/confidentialite')} className="text-primary underline">politique de confidentialité</button> et au RGPD. Les données saisies par l'utilisateur (informations CFA, documents) sont utilisées exclusivement pour la génération de documents et ne sont jamais partagées avec des tiers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 9 — Résiliation</h2>
            <p>
              L'utilisateur peut supprimer son compte à tout moment. GROUPE AVERREO se réserve le droit de suspendre ou résilier l'accès d'un utilisateur en cas de non-respect des présentes CGV, sans préjudice de tout dommage et intérêt.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 10 — Droit applicable</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents du ressort de Créteil.
            </p>
          </div>
        </section>

        <p className="text-xs text-muted-foreground mt-12">Dernière mise à jour : 31 mars 2026</p>
      </div>
    </div>
  );
}
