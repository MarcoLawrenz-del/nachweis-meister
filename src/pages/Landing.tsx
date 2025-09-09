import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Logo } from '@/components/Brand/Logo';
import { WORDING } from '@/content/wording';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  Star,
  Eye,
  Zap,
  BarChart3,
  Download,
  Play,
  Check,
  Building2,
  Scale,
  Briefcase
} from 'lucide-react';
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
    description: 'Ideal für kleinere Bauunternehmen',
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
    description: 'Für wachsende Unternehmen',
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
    description: 'Für etablierte Generalunternehmer',
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
    description: 'Individuelle Lösung für Konzerne',
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
      // Enterprise - redirect to contact
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
        <title>{WORDING.productName} - {WORDING.categoryLabel} | {WORDING.cta.startTrial}</title>
        <meta name="description" content={`${WORDING.pitchSubline} Jetzt ${WORDING.cta.startTrial.toLowerCase()}.`} />
        <meta name="keywords" content="Nachunternehmer, Compliance, Baurecht, Pflichtnachweise, Freistellungsbescheinigung, A1-Bescheinigung, Generalunternehmer" />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${WORDING.productName} - ${WORDING.categoryLabel}`} />
        <meta property="og:description" content={`${WORDING.pitchOneLiner} ${WORDING.cta.startTrial}.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://subfix.de" />
        <meta property="og:image" content="/og-default.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="subfix - Nachunternehmer-Compliance automatisiert" />
        <meta name="twitter:description" content="Rechtssichere Projektabwicklung durch automatisierte Überwachung aller Pflichtdokumente." />
        <meta name="twitter:image" content="/og-default.png" />
        
        {/* Structured Data */}
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
            <Badge variant="secondary" className="mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Neu: Automatische Rechtssicherheit
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {WORDING.pitchOneLiner}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {WORDING.pitchSubline}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {WORDING.valuePillars.map((pillar) => (
                <Badge key={pillar} variant="outline" className="text-base px-4 py-1">
                  {pillar}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" onClick={handleStartTrial}>
                <Play className="w-5 h-5 mr-2" />
                {WORDING.cta.startTrial}
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <a href="#demo">
                  <Eye className="w-5 h-5 mr-2" />
                  {WORDING.cta.viewDemo}
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
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

        {/* So funktioniert's */}
        <section id="features" className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                So funktioniert's
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Vier einfache Schritte zu rechtssicherer Compliance - 
                vollautomatisch und ohne Aufwand für Sie
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="relative">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <CardTitle>Pflichten bestimmen</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <FileText className="w-8 h-8 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    System erkennt automatisch alle rechtlich erforderlichen Dokumente 
                    basierend auf Unternehmenstyp und Einsatzgebiet
                  </p>
                </CardContent>
              </Card>

              <Card className="relative">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <CardTitle>Einladen & Upload</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nachunternehmer erhalten sicheren Upload-Link und laden 
                    alle Dokumente selbstständig hoch - mobil optimiert
                  </p>
                </CardContent>
              </Card>

              <Card className="relative">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <CardTitle>Erinnern & Eskalieren</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Automatische Erinnerungen vor Ablauf, Eskalation bei 
                    kritischen Fristen - Sie werden nur bei Problemen informiert
                  </p>
                </CardContent>
              </Card>

              <Card className="relative">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    4
                  </div>
                  <CardTitle>Prüfen & Freigeben</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Übersichtliche Prüfung aller Dokumente, Freigabe mit einem Klick, 
                    Rechtssicherheit durch automatische Dokumentation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Rechtssicher
                </Badge>
                <h3 className="text-3xl font-bold mb-6">
                  Nur Pflichten warnen - keine falschen Alarme
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Intelligente Erkennung unterscheidet zwischen rechtlich verpflichtenden 
                  und optionalen Dokumenten. Sie erhalten nur Warnungen für echte Compliance-Risiken.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>Automatische Kategorisierung nach Rechtsgrundlage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>Unterscheidung Einzel-, GbR- und Bauunternehmen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>EU/Nicht-EU Arbeiter automatisch berücksichtigt</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Müller Bau GmbH</CardTitle>
                      <Badge variant="secondary" className="bg-success text-success-foreground">
                        Compliant
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Freistellungsbescheinigung</span>
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">A1-Entsende-Nachweis</span>
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">Betriebshaftpflicht</span>
                        <span className="text-xs">Optional</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Requirements */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative order-2 lg:order-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Automatische Terminierung
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">SokaBau-Nachweis</span>
                          <Badge variant="outline">Monatlich</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nächste Fälligkeit: 31.01.2025
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Lohnsteuer-Nachweis</span>
                          <Badge variant="outline">Monatlich</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Automatisch erstellt für Februar 2025
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="order-1 lg:order-2">
                <Badge variant="outline" className="mb-4">
                  <Zap className="w-4 h-4 mr-2" />
                  Automatisiert
                </Badge>
                <h3 className="text-3xl font-bold mb-6">
                  Monats-Pflichten automatisch terminiert
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Wiederkehrende Verpflichtungen wie SokaBau-Nachweise werden automatisch 
                  jeden Monat neu erstellt und terminiert - ohne Ihr Zutun.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>SokaBau & BG-Nachweise automatisch</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>Lohnsteuer-Anmeldungen terminiert</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>Erinnerungen rechtzeitig vor Fälligkeit</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Prüfer-Links & Export */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  <Users className="w-4 h-4 mr-2" />
                  Team-Kollaboration
                </Badge>
                <h3 className="text-3xl font-bold mb-6">
                  Prüfer-Links & Export für externe Teams
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Teilen Sie sichere Prüfer-Links mit externen Mitarbeitern oder 
                  exportieren Sie alle Daten für Ihre bestehenden Systeme.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>Zeitlich begrenzte Prüfer-Zugänge</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>PDF & Excel Export aller Dokumente</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span>API-Anbindung für ERP-Systeme</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export & Freigaben</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Compliance-Report (PDF)
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Excel-Export aller Nachweise
                      </Button>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Aktive Prüfer-Links:</p>
                        <div className="space-y-1">
                          <p>• Max Mustermann (Projekt Berlin)</p>
                          <p>• Team-Lead Hamburg (bis 15.02.2025)</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl font-medium mb-8 text-foreground">
              "subfix spart uns pro Projekt mehrere Stunden pro Woche. 
              Die automatische Überwachung gibt uns die Sicherheit, 
              dass wir rechtlich immer auf der sicheren Seite stehen."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                MK
              </div>
              <div className="text-left">
                <p className="font-semibold">Markus Kellner</p>
                <p className="text-muted-foreground">Leitung AV, Bauunternehmen Kellner GmbH</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Transparente Preise
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Wählen Sie den Plan, der zu Ihrem Unternehmen passt. 
                Alle Pläne mit 14 Tagen kostenlosen Test, danach Read-Only ohne Kündigung.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`relative ${plan.badge ? 'border-2 border-primary' : ''}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      {plan.price > 0 ? (
                        <>
                          <span className="text-4xl font-bold">{plan.price}€</span>
                          <span className="text-muted-foreground">/Monat</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">Auf Anfrage</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.maxSubcontractors}
                    </p>
                    <CardDescription className="mt-4">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant={plan.badge ? 'default' : 'outline'}
                      onClick={() => handlePricingSelect(plan)}
                      disabled={isCreatingCheckout === plan.name}
                    >
                      {isCreatingCheckout === plan.name ? (
                        'Wird erstellt...'
                      ) : plan.price > 0 ? (
                        WORDING.cta.startTrial
                      ) : (
                        'Kontakt aufnehmen'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert className="mt-12 max-w-4xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Trial-Information:</strong> Nach den 14 kostenlosen Testtagen wechselt Ihr Account 
                automatisch in den Read-Only Modus. Sie können jederzeit ein Abonnement starten - 
                keine automatische Belastung, keine versteckten Kosten.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Demo Screenshots */}
        <section id="demo" className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sehen Sie subfix in Aktion
              </h2>
              <p className="text-xl text-muted-foreground">
                Drei Screenshots zeigen Ihnen die wichtigsten Funktionen
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/30 rounded-t-lg flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-primary" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">Compliance Dashboard</h3>
                    <p className="text-muted-foreground text-sm">
                      Sofortiger Überblick über alle kritischen Nachweise und Handlungsempfehlungen. 
                      Ampelsystem zeigt rechtliche Risiken auf einen Blick.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-success/10 to-success/30 rounded-t-lg flex items-center justify-center">
                    <Users className="w-16 h-16 text-success" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">Subunternehmer-Profil</h3>
                    <p className="text-muted-foreground text-sm">
                      Detailansicht aller Dokumente, Prüfungsstatus und Erinnerungen. 
                      Klare Next-Best-Actions für optimalen Workflow.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-warning/10 to-warning/30 rounded-t-lg flex items-center justify-center">
                    <FileText className="w-16 h-16 text-warning" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">Mobiler Upload</h3>
                    <p className="text-muted-foreground text-sm">
                      Nachunternehmer laden Dokumente direkt vom Smartphone hoch. 
                      Sichere Links, Kamera-Integration, automatische Validierung.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link to="/public-demo">
                  <Play className="w-5 h-5 mr-2" />
                  Interaktive Demo starten
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">subfix</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Automatisierte Nachunternehmer-Compliance für rechtssichere Projektabwicklung.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Rechtliches</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/impressum" className="hover:text-foreground">Impressum</a></li>
                  <li><a href="/datenschutz" className="hover:text-foreground">Datenschutz</a></li>
                  <li><a href="/agb" className="hover:text-foreground">AGB</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="mailto:support@subfix.de" className="hover:text-foreground">support@subfix.de</a></li>
                  <li><a href="tel:+4989123456789" className="hover:text-foreground">+49 89 123 456 789</a></li>
                  <li><span>Mo-Fr 9:00-17:00 Uhr</span></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Unternehmen</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="mailto:info@subfix.de" className="hover:text-foreground">Über uns</a></li>
                  <li><a href="mailto:sales@subfix.de" className="hover:text-foreground">Enterprise Sales</a></li>
                  <li><a href="/blog" className="hover:text-foreground">Blog</a></li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
              <p>&copy; 2025 subfix. Alle Rechte vorbehalten.</p>
              <p>Made with ❤️ for German Generalunternehmer</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}