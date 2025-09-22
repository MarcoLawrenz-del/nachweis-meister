import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Mail } from "lucide-react";
import { Logo } from "@/components/Brand/Logo";

interface TokenErrorProps {
  error: 'not_found' | 'expired';
}

export function TokenError({ error }: TokenErrorProps) {
  const isExpired = error === 'expired';

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Logo className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Upload-Link</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isExpired ? (
                <Clock className="h-12 w-12 text-warning" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <CardTitle className="text-xl">
              {isExpired ? "Link abgelaufen" : "Link ungültig"}
            </CardTitle>
            <CardDescription>
              {isExpired 
                ? "Dieser Upload-Link ist abgelaufen und kann nicht mehr verwendet werden."
                : "Dieser Upload-Link ist ungültig oder existiert nicht."
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className={isExpired ? "border-warning bg-warning/5" : "border-destructive bg-destructive/5"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isExpired ? (
                  <>
                    Upload-Links sind aus Sicherheitsgründen nur 14 Tage gültig.
                    Bitte wenden Sie sich an Ihren Auftraggeber für einen neuen Link.
                  </>
                ) : (
                  <>
                    Überprüfen Sie bitte den Link in Ihrer E-Mail oder wenden Sie sich an Ihren Auftraggeber.
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Was können Sie tun?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Kontaktieren Sie Ihren Auftraggeber für einen neuen Upload-Link</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Überprüfen Sie, ob Sie den vollständigen Link aus der E-Mail kopiert haben</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = 'mailto:'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Auftraggeber kontaktieren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}