import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function CGU() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground mb-6 block">&larr; Retour</button>
        <h1 className="text-3xl font-bold mb-8">Conditions Générales d'Utilisation</h1>

        <section className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 1 — Présentation du service</h2>
            <p>
              Qual'IA est une plateforme éditée par GROUPE AVERREO permettant aux organismes de formation (CFA, centres de formation) de préparer leur certification Qualiopi en s'appuyant sur l'intelligence artificielle pour générer les documents requis par le Référentiel National Qualité (RNQ) version 9 de janvier 2024.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 2 — Acceptation des CGU</h2>
            <p>
              L'utilisation de Qual'IA implique l'acceptation pleine et entière des présentes CGU. L'utilisateur reconnaît en avoir pris connaissance et s'engage à les respecter.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 3 — Inscription et compte</h2>
            <p>
              L'accès au service nécessite la création d'un compte avec une adresse email valide. L'utilisateur est responsable de la confidentialité de ses identifiants et de toutes les activités effectuées depuis son compte.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 4 — Utilisation du service</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fournir des informations exactes et à jour sur son organisme de formation</li>
              <li>Utiliser le service uniquement pour la préparation de la certification Qualiopi</li>
              <li>Ne pas tenter de contourner les limitations techniques du service</li>
              <li>Ne pas revendre, redistribuer ou partager l'accès au service</li>
              <li>Vérifier et adapter les documents générés avant utilisation en audit</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 5 — Intelligence artificielle</h2>
            <p>
              Qual'IA utilise des modèles d'intelligence artificielle (Claude d'Anthropic, Gemini de Google) pour générer des documents. L'utilisateur reconnaît que :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Les documents générés sont des propositions qui doivent être revues et validées</li>
              <li>L'IA ne se substitue pas à l'expertise d'un consultant qualité</li>
              <li>Les résultats peuvent varier d'une génération à l'autre</li>
              <li>GROUPE AVERREO ne garantit pas l'obtention de la certification Qualiopi</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 6 — Disponibilité</h2>
            <p>
              GROUPE AVERREO s'efforce de maintenir le service accessible 24h/24, 7j/7, mais ne garantit pas une disponibilité ininterrompue. Des interruptions pour maintenance, mises à jour ou cas de force majeure peuvent survenir sans préavis.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 7 — Propriété des contenus</h2>
            <p>
              Les documents générés par l'utilisateur via Qual'IA sont sa propriété. Il en assume l'entière responsabilité quant à leur utilisation. La plateforme, son code, son design et ses algorithmes restent la propriété exclusive de GROUPE AVERREO.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 8 — Comportements interdits</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utiliser le service à des fins illégales ou frauduleuses</li>
              <li>Tenter d'accéder aux données d'autres utilisateurs</li>
              <li>Surcharger intentionnellement les serveurs</li>
              <li>Extraire automatiquement des données du service (scraping)</li>
              <li>Utiliser le service pour générer du contenu sans rapport avec Qualiopi</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 9 — Suspension et résiliation</h2>
            <p>
              GROUPE AVERREO se réserve le droit de suspendre ou résilier tout compte en cas de violation des présentes CGU, sans préavis ni indemnité. L'utilisateur peut supprimer son compte à tout moment.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 10 — Modification des CGU</h2>
            <p>
              GROUPE AVERREO se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou par notification sur la plateforme. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Article 11 — Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit français. Tout litige relatif à l'interprétation ou l'exécution des présentes sera soumis aux tribunaux compétents du ressort de Créteil.
            </p>
          </div>
        </section>

        <p className="text-xs text-muted-foreground mt-12">Dernière mise à jour : 31 mars 2026</p>
      </div>
    </div>
  );
}
