import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Logo size={28} showWordmark={true} />
            <span className="text-xs text-muted-foreground">par Groupe Averreo</span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
            <Link to="/cgv" className="hover:text-foreground transition-colors">CGV</Link>
            <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Groupe Averreo — Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
