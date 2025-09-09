import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { BRAND } from "@/config/brand";

const PRICE_IDS = {
  starter: "price_1XXXXXXXXXXXXXXXXXXXXXXXX", // TODO: Replace with real Stripe Price ID
  growth: "price_1XXXXXXXXXXXXXXXXXXXXXXXX",   // TODO: Replace with real Stripe Price ID  
  pro: "price_1XXXXXXXXXXXXXXXXXXXXXXXX"         // TODO: Replace with real Stripe Price ID
};

const plans = [
  {
    name: "Starter",
    price: "49",
    priceId: PRICE_IDS.starter,
    description: "Perfekt für kleinere Projekte",
    features: [
      "Bis zu 10 aktive Nachunternehmer",
      "Dokumenten-Upload & Verwaltung",
      "Compliance-Tracking",
      "E-Mail-Erinnerungen",
      "Basis-Support"
    ],
    quota: 10
  },
  {
    name: "Growth",
    price: "149", 
    priceId: PRICE_IDS.growth,
    description: "Ideal für wachsende Unternehmen",
    features: [
      "Bis zu 50 aktive Nachunternehmer",
      "Erweiterte Projekt-Verwaltung",
      "Automatisierte Workflows",
      "Prioritäts-Support",
      "Compliance-Reports"
    ],
    quota: 50,
    recommended: true
  },
  {
    name: "Pro",
    price: "399",
    priceId: PRICE_IDS.pro,
    description: "Für professionelle Bauprojekte",
    features: [
      "51-200 aktive Nachunternehmer",
      "API-Zugang",
      "Erweiterte Integrationen",
      "Dedicated Account Manager",
      "SLA-Garantie"
    ],
    quota: 200
  }
];

export default function Pricing() {
  const { subscription, createCheckoutSession, openCustomerPortal, loading } = useSubscription();

  const handlePlanSelection = (priceId: string) => {
    createCheckoutSession(priceId);
  };

  const isPlanActive = (planName: string) => {
    return subscription?.plan === planName.toLowerCase();
  };

  const canUpgrade = (planQuota: number) => {
    if (!subscription) return true;
    const currentQuotas = {
      free: 0,
      starter: 10,
      growth: 50,
      pro: 200,
      enterprise: 999999
    };
    const currentQuota = currentQuotas[subscription.plan] || 0;
    return planQuota > currentQuota;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-96 mx-auto mb-8"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Preise & Pläne</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Wählen Sie den passenden Plan für Ihr Unternehmen
        </p>
        
        {subscription?.is_trial_expired && subscription.subscription_status !== 'active' && (
          <div className="bg-warning/10 border border-warning rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-warning-foreground font-medium">
              ⚠️ Ihre Testphase ist abgelaufen. Bitte wählen Sie einen Plan, um fortzufahren.
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.recommended ? 'ring-2 ring-primary' : ''}`}>
            {plan.recommended && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                Empfohlen
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="flex items-baseline mt-4">
                <span className="text-4xl font-bold">€{plan.price}</span>
                <span className="text-muted-foreground ml-2">/Monat</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isPlanActive(plan.name) ? (
                <div className="w-full space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    Aktueller Plan
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full"
                    onClick={openCustomerPortal}
                  >
                    Abonnement verwalten
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  variant={plan.recommended ? "default" : "outline"}
                  onClick={() => handlePlanSelection(plan.priceId)}
                  disabled={!canUpgrade(plan.quota)}
                >
                  {canUpgrade(plan.quota) ? "Plan wählen" : "Downgrade nicht möglich"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">{BRAND.terms.enterprise}</h3>
          <p className="text-muted-foreground mb-6">
            Benötigen Sie mehr als 200 aktive Nachunternehmer oder spezielle Anforderungen? 
            Kontaktieren Sie uns für ein individuelles Angebot.
          </p>
          <Button variant="outline" size="lg">
            Kontakt aufnehmen
          </Button>
        </div>
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>
          Alle Preise verstehen sich zzgl. MwSt. • 14 Tage kostenlose Testphase • 
          Jederzeit kündbar
        </p>
      </div>
    </div>
  );
}