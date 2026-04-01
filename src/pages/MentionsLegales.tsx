import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function MentionsLegales() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground mb-6 block">&larr; Retour</button>
        <h1 className="text-3xl font-bold mb-8">Mentions légales</h1>

        <section className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Éditeur du site</h2>
            <p>
              <strong>GROUPE AVERREO</strong><br />
              SASU au capital de 100,00 €<br />
              28 avenue des Pépinières, 94260 Fresnes<br />
              SIRET : 944 316 207 00017<br />
              RCS Créteil — N° TVA : FR01944316207<br />
              Code NAF : 85.59A — Formation continue d'adultes
            </p>
            <p className="mt-2">
              <strong>Directeur de la publication :</strong> Magassa Lamine, Président
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Hébergement</h2>
            <p>
              <strong>Google Cloud Platform — Cloud Run</strong><br />
              Google Ireland Limited<br />
              Gordon House, Barrow Street, Dublin 4, Irlande<br />
              Région de déploiement : europe-west1 (Belgique)
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>
              Email : contact@groupe-averreo.fr<br />
              Adresse : 28 avenue des Pépinières, 94260 Fresnes
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu du site Qual'IA (textes, graphismes, logiciels, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, etc.) est la propriété de GROUPE AVERREO ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit est interdite sans l'autorisation écrite préalable de GROUPE AVERREO.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Responsabilité</h2>
            <p>
              GROUPE AVERREO s'efforce de fournir des informations aussi précises que possible sur le site Qual'IA. Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
            </p>
            <p>
              Les documents générés par l'intelligence artificielle de Qual'IA constituent une aide à la préparation de l'audit Qualiopi. Ils ne se substituent en aucun cas à l'expertise d'un consultant qualité et n'engagent pas la responsabilité de GROUPE AVERREO quant au résultat de l'audit.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Données personnelles</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous à : contact@groupe-averreo.fr
            </p>
            <p>
              Pour plus d'informations, consultez notre <button onClick={() => navigate('/confidentialite')} className="text-primary underline">politique de confidentialité</button>.
            </p>
          </div>
        </section>

        <p className="text-xs text-muted-foreground mt-12">Dernière mise à jour : 31 mars 2026</p>
      </div>
    </div>
  );
}
