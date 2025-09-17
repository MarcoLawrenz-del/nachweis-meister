import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, CheckCircle } from 'lucide-react';
import { BRAND } from '@/config/brand';

export default function Setup() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeSetup } = useAuthContext();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !companyName.trim()) {
      toast({
        title: 'Fehlende Eingaben',
        description: 'Bitte füllen Sie alle Felder aus.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await completeSetup();

      if (error) {
        toast({
          title: 'Setup-Fehler',
          description: 'Fehler beim Erstellen Ihres Profils. Bitte versuchen Sie es erneut.',
          variant: 'destructive'
        });
        console.error('Setup error:', error);
      } else {
        toast({
          title: 'Willkommen!',
          description: 'Ihr Profil wurde erfolgreich erstellt.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: 'Setup-Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Willkommen bei {BRAND.name}!</CardTitle>
          <CardDescription>
            Vervollständigen Sie Ihr Profil, um mit der Verwaltung Ihrer {BRAND.terms.subcontractor} zu beginnen.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ihr Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Firmenname</Label>
              <Input
                id="company"
                type="text"
                placeholder="Mustermann Bau GmbH"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                Automatische Fristüberwachung
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                Professionelles Dokumenten-Management
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 text-success" />
                Vollständige Compliance-Kontrolle
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Profil wird erstellt...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Profil erstellen und loslegen
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}