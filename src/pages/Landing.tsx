import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Shield, 
  Clock,
  CheckCircle,
  FileCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Play
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// JSON-LD strukturierte Daten für SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://subfix.de/#organization",
      "name": "subfix",
      "description": "Automatisiertes Nachunternehmer-Management für Bauprojekte. Rechtssichere Compliance-Prüfung von Pflichtdokumenten.",
      "url": "https://subfix.de",
      "logo": {
        "@type": "ImageObject",
        "url": "https://subfix.de/brand/subfix-logo.svg"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://subfix.de/#software",
      "name": "subfix",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Compliance-Management-Software für Bauprojekte. Automatisierte Prüfung von Nachunternehmer-Dokumenten, rechtssichere Abwicklung und transparente Übersicht."
    }
  ]
};

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>subfix - Nachunternehmer-Compliance automatisiert | 14 Tage kostenlos testen</title>
        <meta 
          name="description" 
          content="Automatisierte Compliance-Prüfung für Nachunternehmer im Bauwesen. Pflichtdokumente rechtssicher verwalten, Risiken minimieren. Jetzt 14 Tage kostenlos testen!" 
        />
        <meta name="keywords" content="Nachunternehmer-Management, Baustellendokumentation, Compliance Software, Baugewerbe, Pflichtdokumente, Rechtssicherheit" />
        
        {/* JSON-LD strukturierte Daten */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <img 
              src="/brand/subfix-logo.svg" 
              alt="subfix - Nachunternehmer-Compliance Software" 
              className="h-8 w-auto"
            />
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Anmelden</Link>
              </Button>
              <Button asChild className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                <Link to="/register">14 Tage kostenlos testen</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              🚀 Ohne Rechtsberatung - Technische Lösung für Compliance
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Pflichtdokumente{" "}
              <span className="text-brand-primary bg-gradient-to-r from-brand-primary to-blue-600 bg-clip-text text-transparent">
                automatisiert
              </span>{" "}
              prüfen
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Nachunternehmer-Management für Bauprojekte. Automatisierte Compliance-Prüfung, 
              rechtssichere Dokumentation und transparente Übersicht aller Pflichtdokumente.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="bg-brand-primary hover:bg-brand-primary/90 text-white text-lg px-8 py-6">
                <Link to="/register">
                  14 Tage kostenlos testen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                <Link to="/public-demo">
                  <Play className="mr-2 h-5 w-5" />
                  Live-Demo ansehen
                </Link>
              </Button>
            </div>
          </div>
        </main>

        {/* Features */}
        <section className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
              Warum subfix die richtige Wahl ist
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-8 text-center">
                  <FileCheck className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">Automatisierte Prüfung</h3>
                  <p className="text-muted-foreground">
                    Alle Pflichtdokumente werden automatisch auf Vollständigkeit und Gültigkeit geprüft.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">Rechtssicherheit</h3>
                  <p className="text-muted-foreground">
                    Vollständige Dokumentation und Nachverfolgbarkeit aller Compliance-Aktivitäten.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">Zentrale Verwaltung</h3>
                  <p className="text-muted-foreground">
                    Alle Nachunternehmer, Projekte und Dokumente übersichtlich an einem Ort.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-primary text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Bereit für automatisierte Compliance?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Starten Sie noch heute und erleben Sie, wie einfach 
              Nachunternehmer-Management sein kann. Ohne Risiko, ohne Verpflichtung.
            </p>
            
            <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
              <Link to="/register">
                Jetzt 14 Tage kostenlos testen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-muted/30 py-12">
          <div className="container mx-auto px-4 text-center">
            <img 
              src="/brand/subfix-logo.svg" 
              alt="subfix" 
              className="h-8 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground">
              © 2024 subfix · Compliance vereinfacht · Made in Germany 🇩🇪
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}