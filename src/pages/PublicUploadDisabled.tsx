import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function PublicUploadDisabled() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Upload vorübergehend nicht verfügbar
            </h1>
            <p className="text-sm text-muted-foreground">
              Ihr Auftraggeber wird informiert.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Diese Funktion wurde vorübergehend deaktiviert. Bitte wenden Sie sich 
            direkt an Ihren Auftraggeber für weitere Informationen.
          </p>

          <Button 
            variant="outline" 
            onClick={() => window.close()}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Schließen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}