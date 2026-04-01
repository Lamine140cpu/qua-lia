import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Confidentialite() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground mb-6 block">&larr; Retour</button>
        <h1 className="text-3xl font-bold mb-8">Politique de confidentialité</h1>

        <section className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données est GROUPE AVERREO, SASU au capital de 100,00 €, dont le siège social est au 28 avenue des Pépinières, 94260 Fresnes, représentée par Magassa Lamine en qualité de Président.
            </p>
            <p className="mt-1">Contact : contact@groupe-averreo.fr</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Données collectées</h2>
            <p>Dans le cadre de l'utilisation de Qual'IA, nous collectons :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Données de compte :</strong> adresse email, mot de passe (haché)</li>
              <li><strong>Données CFA :</strong> nom de l'organisme, adresse, SIRET, nom du responsable, activités de formation — saisies volontairement par l'utilisateur</li>
              <li><strong>Documents générés :</strong> contenus produits par l'IA à partir des données saisies</li>
              <li><strong>Données de paiement :</strong> traitées exclusivement par Stripe (nous ne stockons pas vos données bancaires)</li>
              <li><strong>Données techniques :</strong> adresse IP, type de navigateur, pages visitées</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Finalités du traitement</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fourniture du service Qual'IA (génération de documents, pré-audit IA)</li>
              <li>Gestion des comptes utilisateurs</li>
              <li>Traitement des paiements</li>
              <li>Amélioration du service</li>
              <li>Communication relative au service (notifications, mises à jour)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Base légale</h2>
            <p>Les traitements sont fondés sur :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>L'exécution du contrat</strong> pour la fourniture du service</li>
              <li><strong>Le consentement</strong> pour les communications marketing</li>
              <li><strong>L'intérêt légitime</strong> pour l'amélioration du service et la sécurité</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Sous-traitants et transferts</h2>
            <p>Vos données peuvent être traitées par les sous-traitants suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase</strong> (hébergement base de données — UE)</li>
              <li><strong>Google Cloud Platform</strong> (hébergement application — europe-west1, Belgique)</li>
              <li><strong>Anthropic</strong> (API Claude pour la génération IA — États-Unis, clauses contractuelles types)</li>
              <li><strong>Google AI</strong> (API Gemini pour la génération visuelle — États-Unis, clauses contractuelles types)</li>
              <li><strong>Stripe</strong> (paiement sécurisé — certifié PCI DSS)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Durée de conservation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Données de compte :</strong> conservées pendant la durée d'utilisation du service + 3 ans après suppression du compte</li>
              <li><strong>Documents générés :</strong> conservés tant que le compte est actif</li>
              <li><strong>Données de paiement :</strong> conservées selon les obligations légales (10 ans pour les données comptables)</li>
              <li><strong>Données techniques :</strong> 13 mois maximum</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (« droit à l'oubli »)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition</li>
              <li>Droit à la limitation du traitement</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits : contact@groupe-averreo.fr<br />
              Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Cookies</h2>
            <p>
              Qual'IA utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Sécurité</h2>
            <p>
              GROUPE AVERREO met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, authentification sécurisée, hébergement certifié, accès restreint aux données.
            </p>
          </div>
        </section>

        <p className="text-xs text-muted-foreground mt-12">Dernière mise à jour : 31 mars 2026</p>
      </div>
    </div>
  );
}
