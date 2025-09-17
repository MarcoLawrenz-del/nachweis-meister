import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RequirementSelector from '@/components/RequirementSelector';
import { Badge } from '@/components/ui/badge';

export default function RequirementSelectorDemo() {
  const [normalValue, setNormalValue] = useState<"required" | "optional" | "hidden">("required");
  const [compactValue, setCompactValue] = useState<"required" | "optional" | "hidden">("optional");

  const documents = [
    { id: 'haftpflicht', name: 'Haftpflichtversicherung', value: normalValue, setValue: setNormalValue },
    { id: 'freistellung', name: 'Freistellungsbescheinigung', value: compactValue, setValue: setCompactValue },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">RequirementSelector Demo</h1>
        <p className="text-muted-foreground">
          Tri-State Auswahl für Dokumentenanforderungen: Pflicht/Optional/Nicht anfordern
        </p>
      </div>

      <div className="grid gap-6">
        {/* Normal Size Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Größe</CardTitle>
            <CardDescription>
              Normale Darstellung der RequirementSelector Komponente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Haftpflichtversicherung</h3>
                <p className="text-sm text-muted-foreground">
                  Nachweis der Betriebshaftpflichtversicherung
                </p>
              </div>
              <RequirementSelector 
                value={normalValue} 
                onChange={setNormalValue} 
              />
            </div>
            
            <div className="text-sm">
              <strong>Aktueller Wert:</strong> 
              <Badge className="ml-2">
                {normalValue === 'required' && 'Pflicht'}
                {normalValue === 'optional' && 'Optional'}
                {normalValue === 'hidden' && 'Nicht anfordern'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Compact Size Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Kompakte Größe</CardTitle>
            <CardDescription>
              Kompakte Darstellung für platzsparende Anzeige
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Freistellungsbescheinigung</h3>
                <p className="text-sm text-muted-foreground">
                  Sozialversicherungs-Freistellungsbescheinigung
                </p>
              </div>
              <RequirementSelector 
                value={compactValue} 
                onChange={setCompactValue} 
                compact 
              />
            </div>
            
            <div className="text-sm">
              <strong>Aktueller Wert:</strong> 
              <Badge variant="outline" className="ml-2">
                {compactValue === 'required' && 'Pflicht'}
                {compactValue === 'optional' && 'Optional'}
                {compactValue === 'hidden' && 'Nicht anfordern'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Package Profiles Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Package Profile Beispiele</CardTitle>
            <CardDescription>
              Vorkonfigurierte Anforderungsprofile aus der contractors.ts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Standard Paket</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Haftpflicht:</span>
                    <Badge>Pflicht</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Freistellung:</span>
                    <Badge>Pflicht</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Gewerbeanmeldung:</span>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Minimal Paket</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Haftpflicht:</span>
                    <Badge>Pflicht</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Freistellung:</span>
                    <Badge>Pflicht</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Gewerbeanmeldung:</span>
                    <Badge variant="outline">Versteckt</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Erweitert Paket</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Haftpflicht:</span>
                    <Badge>Pflicht</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Freistellung:</span>
                    <Badge>Pflicht</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Gewerbeanmeldung:</span>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unbedenklichkeit:</span>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}