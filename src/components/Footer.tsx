import { Link } from 'react-router-dom';
import { Logo } from '@/components/Brand/Logo';

export function Footer() {
  return (
    <footer className="border-t bg-muted/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Company Info */}
          <div className="space-y-4">
            <Logo width={120} height={36} />
            <p className="text-sm text-muted-foreground">
              Compliance vereinfacht.<br />
              Pflichtnachweise automatisch einsammeln.
            </p>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="font-medium mb-3">Rechtliches</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/impressum" className="hover:text-foreground transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="hover:text-foreground transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link to="/dienstleister" className="hover:text-foreground transition-colors">
                  Dienstleister
                </Link>
              </li>
              <li>
                <Link to="/agb" className="hover:text-foreground transition-colors">
                  AGB
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-medium mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/kontakt" className="hover:text-foreground transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@subfix.de" 
                  className="hover:text-foreground transition-colors"
                >
                  support@subfix.de
                </a>
              </li>
            </ul>
          </div>

          {/* Produkt */}
          <div>
            <h3 className="font-medium mb-3">Produkt</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/#features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="hover:text-foreground transition-colors">
                  Preise
                </Link>
              </li>
              <li>
                <Link to="/demo" className="hover:text-foreground transition-colors">
                  Demo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 OK Beteiligungsgesellschaft mbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span className="text-sm text-muted-foreground">Made in Berlin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}