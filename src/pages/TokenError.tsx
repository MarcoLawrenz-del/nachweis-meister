import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Brand/Logo";

interface TokenErrorProps {
  type?: 'not_found' | 'expired';
  onBack?: () => void;
}

export function TokenError({ type = 'not_found', onBack }: TokenErrorProps) {
  const isExpired = type === 'expired';
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl">
              {isExpired ? 'Link abgelaufen' : 'Link nicht gefunden'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              {isExpired 
                ? 'Dieser Upload-Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.'
                : 'Der Upload-Link ist ungültig oder wurde bereits verwendet. Bitte wenden Sie sich an Ihren Auftraggeber.'
              }
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Neue Einladung anfordern</h4>
                  <p className="text-sm text-muted-foreground">
                    Kontaktieren Sie Ihren Auftraggeber, um eine neue Einladung zu erhalten.
                  </p>
                </div>
              </div>
            </div>
            
            {onBack && (
              <Button 
                variant="outline" 
                onClick={onBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}