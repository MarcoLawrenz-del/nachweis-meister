import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield, Clock, FileCheck, Users, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nachweis-Meister</h1>
              <p className="text-xs text-muted-foreground">Baugewerbe Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link to="/register">
              <Button>Registrieren</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight mb-6">
            Professionelle Nachweisführung
            <span className="text-primary block mt-2">für das Baugewerbe</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Verwalten Sie alle pflichtrelevanten Nachweise Ihrer Subunternehmer sicher und rechtskonform. 
            Automatische Fristüberwachung inklusive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="min-w-48">
                <Users className="mr-2 h-5 w-5" />
                Kostenlos registrieren
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="min-w-48">
                Bereits registriert? Anmelden
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-4">Alles was Sie brauchen</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Komplette Lösung für die Verwaltung von Subunternehmern und deren Nachweisdokumenten
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Rechtssicherheit</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatische Überwachung aller relevanten Fristen und Nachweise nach §48b EStG, 
                §13b UStG und weiteren gesetzlichen Bestimmungen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Automatische Fristüberwachung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Rechtzeitige Benachrichtigungen vor Ablauf wichtiger Dokumente. 
                Nie wieder abgelaufene Nachweise übersehen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Digitale Dokumentenverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sichere Speicherung und Verwaltung aller Nachweisdokumente. 
                Schneller Zugriff bei Prüfungen oder Kontrollen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Subunternehmer-Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Zentrale Verwaltung aller Subunternehmer mit Kontaktdaten, 
                Projekthistorie und Bewertungen.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Reporting & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Detaillierte Berichte und Statistiken zu Compliance-Status 
                und Dokumentenvollständigkeit.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Für jede Unternehmensgröße</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Skalierbare Lösung - vom Einzelunternehmer bis zum 
                Großbetrieb mit hunderten Subunternehmern.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="text-center p-8">
            <h3 className="text-2xl font-bold mb-4">Starten Sie noch heute</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Registrieren Sie sich kostenlos und entdecken Sie, wie einfach professionelle 
              Nachweisführung im Baugewerbe sein kann.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="min-w-48">
                  Kostenlos starten
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="min-w-48">
                  Bereits dabei? Anmelden
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Nachweis-Meister. Professionelle Lösung für das Baugewerbe.</p>
      </footer>
    </div>
  );
}