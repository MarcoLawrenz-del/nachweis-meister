import { debug } from '@/lib/debug';

export default function DemoApp() {
  debug.log('🎯 DEMO APP COMPONENT LOADED');
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-success text-success-foreground p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-3xl font-bold mb-4">
            ✅ DEMO FUNKTIONIERT!
          </h1>
          <p className="text-lg">
            Dies ist die Demo-Seite. Sie wurde erfolgreich geladen.
          </p>
          <p className="text-sm mt-2 opacity-90">
            Pfad: {window.location.pathname}
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Demo Inhalt</h2>
          <p className="text-muted-foreground">
            Hier würden normalerweise die Demo-Daten angezeigt werden.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded">
              <h3 className="font-medium text-primary">Projekte</h3>
              <p className="text-2xl font-bold text-primary">8</p>
            </div>
            <div className="bg-success/5 border border-success/20 p-4 rounded">
              <h3 className="font-medium text-success">Nachunternehmer</h3>
              <p className="text-2xl font-bold text-success">12</p>
            </div>
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded">
              <h3 className="font-medium text-destructive">Kritische Nachweise</h3>
              <p className="text-2xl font-bold text-destructive">3</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Demo erfolgreich geladen um {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}