import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Logo } from '@/components/Brand/Logo';
import { UseCaseScreens } from '@/components/marketing/UseCaseScreens';
import { 
  CheckCircle, 
  ArrowRight,
  Play,
  Clock,
  Shield,
  TrendingUp,
  Building2
} from 'lucide-react';
import { PlayIcon } from '@/components/ui/PlayIcon';

interface Step {
  title: string;
  description: string;
}

interface Benefit {
  title: string;
  description: string;
  icon: 'clock' | 'shield' | 'trending' | 'check';
}

interface FAQ {
  question: string;
  answer: string;
}

interface CTA {
  label: string;
  href: string;
  variant: 'default' | 'outline';
}

interface UseCasePageProps {
  title: string;
  intro: string;
  steps: Step[];
  benefits: Benefit[];
  screenshot?: string;
  screenshotCaption?: string;
  screenshots?: Array<"dashboard" | "subProfile" | "uploadMobile">;
  faq: FAQ[];
  ctas: CTA[];
  // SEO
  metaTitle?: string;
  metaDescription?: string;
}

const iconMap = {
  clock: Clock,
  shield: Shield,
  trending: TrendingUp,
  check: CheckCircle,
};

export function UseCasePage({
  title,
  intro,
  steps,
  benefits,
  screenshot,
  screenshotCaption,
  screenshots = ["subProfile", "uploadMobile"],
  faq,
  ctas,
  metaTitle,
  metaDescription
}: UseCasePageProps) {
  return (
    <>
      <Helmet>
        <title>{metaTitle || title}</title>
        <meta name="description" content={metaDescription || intro} />
        <meta property="og:title" content={metaTitle || title} />
        <meta property="og:description" content={metaDescription || intro} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-4">
                {ctas.map((cta, index) => (
                  <Button 
                    key={index}
                    variant={cta.variant} 
                    size="sm"
                    asChild
                  >
                    <Link to={cta.href}>
                      {cta.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {intro}
              </p>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="outline" className="px-3 py-1">
                  <Shield className="w-4 h-4 mr-2" />
                  Nur Pflichten
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Zeitersparnis
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Rechtssicherheit
                </Badge>
              </div>

              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {ctas.map((cta, index) => (
                  <Button 
                    key={index}
                    size="lg" 
                    variant={cta.variant}
                    asChild
                  >
                    <Link to={cta.href}>
                      {cta.variant === 'default' ? (
                        <PlayIcon />
                      ) : (
                        <Play className="w-5 h-5 mr-2" />
                      )}
                      {cta.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                So einfach geht's
              </h2>
              
              <div className="grid md:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                      {index + 1}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-full w-full">
                        <ArrowRight className="w-5 h-5 text-muted-foreground mx-auto" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Die App im Überblick
                </h2>
                <p className="text-xl text-muted-foreground">
                  Sehen Sie, wie einfach die Nachweise-Verwaltung funktioniert
                </p>
              </div>
              <UseCaseScreens keys={screenshots} />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Ihre Vorteile
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => {
                  const Icon = iconMap[benefit.icon];
                  return (
                    <Card key={index} className="text-center">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Häufige Fragen
              </h2>
              
              <div className="space-y-6">
                {faq.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{item.question}</h3>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 bg-brand-primary text-brand-on-primary">
          <div className="container mx-auto px-4 text-center no-transform">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Jetzt kostenlos testen
              </h2>
              <p className="text-xl mb-8 opacity-90">
                14 Tage kostenlos. Danach read-only bis Aktivierung.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {ctas.map((cta, index) => (
                  <Button 
                    key={index}
                    size="lg" 
                    variant={cta.variant === 'default' ? 'secondary' : 'ghost'}
                    asChild
                  >
                    <Link to={cta.href}>
                      {cta.variant === 'default' && <PlayIcon />}
                      {cta.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8 bg-card">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Logo />
            </div>
            <p className="text-sm text-muted-foreground">
              DSGVO-konform · Deutsche Server · Keine Einrichtungsgebühr
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}