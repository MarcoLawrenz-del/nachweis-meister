import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Logo } from '@/components/Brand/Logo';
import { Footer } from '@/components/Footer';
import { WORDING } from '@/content/wording';
import { SCREENSHOTS } from '@/content/screenshots';
import { Shield, FileText, Download, Clock, Users, Check, AlertTriangle, CheckCircle, Eye, Camera, Building2, Scale, Briefcase, Zap, ArrowRight, Star, BarChart3 } from "lucide-react";
import { PlayIcon } from "@/components/ui/PlayIcon";
import { ScreenshotRow } from "@/components/marketing/ScreenshotRow";
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  maxSubcontractors: string;
  badge?: string;
  stripePrice: string;
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: 49,
    description: '≤ 10 beauftragte Firmen',
    maxSubcontractors: 'Bis zu 10 Nachunternehmer',
    features: [
      'Automatische Pflicht-Überwachung',
      'Upload & Prüfungs-Workflow',
      'E-Mail Erinnerungen',
      'Basis-Dashboard',
      'Standard Support'
    ],
    stripePrice: 'price_starter_monthly'
  },
  {
    name: 'Growth',
    price: 149,
    description: '≤ 50 beauftragte Firmen',
    maxSubcontractors: 'Bis zu 50 Nachunternehmer',
    badge: 'Beliebt',
    features: [
      'Alle Starter-Features',
      'Erweiterte Reporting-Tools',
      'Audit-Trail & Versionierung',
      'Team-Kollaboration',
      'Prioritäts-Support',
      'Export-Funktionen'
    ],
    stripePrice: 'price_growth_monthly'
  },
  {
    name: 'Pro',
    price: 399,
    description: '51–200 beauftragte Firmen',
    maxSubcontractors: '51-200 Nachunternehmer',
    features: [
      'Alle Growth-Features',
      'White-Label Lösung',
      'API-Zugang',
      'Erweiterte Automatisierung',
      'Compliance-Beratung',
      'Dedicated Account Manager'
    ],
    stripePrice: 'price_pro_monthly'
  },
  {
    name: 'Enterprise',
    price: 0,
    description: 'Auf Anfrage',
    maxSubcontractors: '200+ Nachunternehmer',
    features: [
      'Alle Pro-Features',
      'On-Premise Deployment möglich',
      'Individuelle Anpassungen',
      'SSO Integration',
      '24/7 Premium Support',
      'Schulungen & Consulting'
    ],
    stripePrice: 'contact'
  }
];

export default function Landing() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(null);

  const handleStartTrial = () => {
    if (user) {
      navigate('/app/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handlePricingSelect = async (plan: PricingPlan) => {
    if (plan.stripePrice === 'contact') {
      window.open('mailto:sales@subfix.de?subject=Enterprise%20Anfrage', '_blank');
      return;
    }

    if (!user) {
      navigate('/register');
      return;
    }

    try {
      setIsCreatingCheckout(plan.name);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: plan.stripePrice,
          successUrl: `${window.location.origin}/app/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/#pricing`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Fehler beim Erstellen der Zahlung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsCreatingCheckout(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>subfix — Pflichtnachweise automatisch einsammeln</title>
        <meta name="description" content="Beauftragte Firmen per Link einladen. Nur Pflichtnachweise anfordern, automatisch erinnern, klar sehen, was fehlt. 14 Tage kostenlos testen." />
        <meta name="keywords" content="Nachunternehmer, Compliance, Baurecht, Pflichtnachweise, Freistellungsbescheinigung, A1-Bescheinigung, Generalunternehmer" />
        
        <meta property="og:title" content={`${WORDING.productName} - ${WORDING.categoryLabel}`} />
        <meta property="og:description" content={`${WORDING.pitchOneLiner} ${WORDING.cta.startTrial}.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://subfix.de" />
        <meta property="og:image" content="/og-default.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="subfix - Nachunternehmer-Compliance automatisiert" />
        <meta name="twitter:description" content="Rechtssichere Projektabwicklung durch automatisierte Überwachung aller Pflichtdokumente." />
        <meta name="twitter:image" content="/og-default.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "subfix",
            "description": "Automatisierte Nachunternehmer-Compliance für Generalunternehmer",
            "url": "https://subfix.de",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "49.00",
              "priceCurrency": "EUR",
              "priceValidUntil": "2025-12-31"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Logo width={120} height={36} />
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Preise
                </a>
                <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
                  Demo
                </a>
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <Button asChild>
                    <Link to="/app/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/login">Anmelden</Link>
                    </Button>
                    <Button onClick={handleStartTrial}>
                      Kostenlos testen
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Pflichtnachweise automatisch einsammeln.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Beauftragte Firmen per Link einladen. subfix fordert nur erforderliche Nachweise an, erinnert automatisch und zeigt klar, was fehlt – einfach, zeitsparend und rechtssicher.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="outline" className="text-base px-4 py-1">
                Einfachheit
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-1">
                Zeitersparnis
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-1">
                Rechtssicherheit
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-1">
                Nur Pflichten
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 no-transform">
              <Button size="lg" onClick={handleStartTrial}>
                <PlayIcon />
                14 Tage kostenlos testen
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#demo">
                  <Eye className="w-4 h-4" />
                  Live-Demo ansehen
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                DSGVO-konform
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Deutsche Server
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Keine Einrichtungsgebühr
              </div>
            </div>
          </div>
        </section>

        {/* Leistungen - 4 Grid, CI-Farben, Icons in Brand Monochrom */}
        <section id="features" className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Leistungen
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Alles was Sie für rechtssichere Nachunternehmer-Compliance brauchen
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Self-Serve Upload */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Camera className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">Self-Serve Upload</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Link/QR, mobil mit Kamera.
                  </p>
                </CardContent>
              </Card>

              {/* Automatische Erinnerungen */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Clock className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">Automatische Erinnerungen</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Inklusive Eskalation.
                  </p>
                </CardContent>
              </Card>

              {/* Nur Pflichten */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Shield className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">Nur Pflichten</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Keine falschen Warnungen.
                  </p>
                </CardContent>
              </Card>

              {/* Prüfer-Export */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Download className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">Prüfer-Export</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Übersicht & Download.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Use Cases - 3 Karten mit echten Screenshots */}
        <section className="py-24 bg-surface-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Häufige Use Cases
              </h2>
              <p className="text-xl text-muted-foreground">
                Branchenspezifische Lösungen für Ihre Compliance-Anforderungen
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* A1 & Entsendung */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <FileText className="w-10 h-10 text-brand-primary mb-4" />
                  <CardTitle className="text-xl">A1 & Entsendung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Automatische Überwachung von A1-Bescheinigungen und Entsendepflichten.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/lp/a1-entsendung">Mehr erfahren</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* SOKA/Unbedenklich */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Building2 className="w-10 h-10 text-brand-primary mb-4" />
                  <CardTitle className="text-xl">SOKA/Unbedenklich</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Vollständige SOKA-BAU Dokumentation ohne Nachlaufen.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/lp/soka-bau-nachweise">Mehr erfahren</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* §48b Freistellungsbescheinigung */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Scale className="w-10 h-10 text-brand-primary mb-4" />
                  <CardTitle className="text-xl">§48b Freistellungs­bescheinigung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Freistellungsbescheinigungen immer gültig im Blick behalten.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/lp/freistellungsbescheinigung-48b">Mehr erfahren</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Branchenspezifische Lösungen */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-6">Branchenspezifische Lösungen</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" className="flex items-center gap-2" asChild>
                  <Link to="/lp/shk">
                    <Briefcase className="w-4 h-4" />
                    SHK-Betriebe
                  </Link>
                </Button>
                <Button variant="outline" className="flex items-center gap-2" asChild>
                  <Link to="/lp/elektro">
                    <Zap className="w-4 h-4" />
                    Elektro-Betriebe
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* So funktioniert's - 4 Schritte */}
        <section className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                So funktioniert's
              </h2>
              <p className="text-xl text-muted-foreground">
                In 4 einfachen Schritten zur automatisierten Compliance
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {/* Schritt 1: Firma einladen */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center mb-6 text-2xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Firma einladen</h3>
                <Users className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Per Link oder QR-Code</p>
              </div>

              {/* Schritt 2: Nachweise hochladen */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center mb-6 text-2xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Nachweise hochladen</h3>
                <Camera className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Mobil per Kamera</p>
              </div>

              {/* Schritt 3: Automatisch erinnern */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center mb-6 text-2xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Automatisch erinnern</h3>
                <Clock className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Bei Ablauf oder Fehlen</p>
              </div>

              {/* Schritt 4: Prüfen & freigeben */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center mb-6 text-2xl font-bold mx-auto">
                  4
                </div>
                <h3 className="text-lg font-semibold mb-2">Prüfen & freigeben</h3>
                <CheckCircle className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Dashboard-Übersicht</p>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots Row */}
        <section id="demo" className="py-24 bg-surface-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Einblick in die App
              </h2>
              <p className="text-xl text-muted-foreground">
                Sehen Sie selbst, wie einfach Compliance-Management sein kann
              </p>
            </div>
            <ScreenshotRow />
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 bg-surface">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="border-border bg-surface-muted">
              <CardContent className="p-12">
                <blockquote className="text-2xl font-medium text-foreground mb-8">
                  "Seit subfix laufen die Nachweise geordnet ein. Wir sparen jede Woche Stunden."
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-primary-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-brand-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Meyer & Sohn GmbH</p>
                    <p className="text-muted-foreground">SHK-Betrieb (12 MA)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-surface-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Preise
              </h2>
              <p className="text-xl text-muted-foreground">
                Transparent und fair. Keine Einrichtungsgebühr. Jederzeit kündbar.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`relative border-border ${plan.badge ? 'ring-2 ring-brand-primary' : ''}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-brand-primary text-white">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      {plan.price > 0 ? (
                        <>
                          <span className="text-4xl font-bold">€{plan.price}</span>
                          <span className="text-muted-foreground">/Monat</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold">Auf Anfrage</span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      onClick={() => handlePricingSelect(plan)}
                      disabled={isCreatingCheckout === plan.name}
                      variant={plan.badge ? "default" : "outline"}
                    >
                      {isCreatingCheckout === plan.name ? 'Lädt...' : plan.price > 0 ? 'Jetzt starten' : 'Kontakt aufnehmen'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section with Testimonial */}
        <section className="py-24 bg-surface">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Testimonial */}
            <div className="mb-16">
              <blockquote className="text-2xl md:text-3xl font-light italic mb-8 leading-relaxed">
                „Seit subfix laufen die Nachweise geordnet ein. Wir sparen jede Woche Stunden."
              </blockquote>
              <div className="flex flex-col items-center">
                <div className="text-lg font-semibold text-foreground mb-1">
                  Meyer & Sohn GmbH
                </div>
                <div className="text-muted-foreground">
                  SHK-Betrieb (12 MA)
                </div>
              </div>
            </div>
            
            {/* CTA */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Starten Sie heute mit subfix
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              14 Tage kostenlos testen. Keine Kreditkarte erforderlich. 
              Setup in unter 5 Minuten.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center no-transform">
              <Button size="lg" onClick={handleStartTrial}>
                <PlayIcon />
                Jetzt kostenlos testen
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/demo">
                  <Eye className="w-4 h-4" />
                  Demo ansehen
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}