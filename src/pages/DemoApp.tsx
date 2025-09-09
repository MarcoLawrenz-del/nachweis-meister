import { debug } from '@/lib/debug';

export default function DemoApp() {
  debug.log('🎯 DEMO APP COMPONENT LOADED');
  
  return (
    <div className="min-h-screen bg-green-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg mb-8">
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
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Demo Inhalt</h2>
          <p className="text-gray-600">
            Hier würden normalerweise die Demo-Daten angezeigt werden.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded border">
              <h3 className="font-medium text-blue-800">Projekte</h3>
              <p className="text-2xl font-bold text-blue-600">8</p>
            </div>
            <div className="bg-green-50 p-4 rounded border">
              <h3 className="font-medium text-green-800">Nachunternehmer</h3>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <div className="bg-red-50 p-4 rounded border">
              <h3 className="font-medium text-red-800">Kritische Nachweise</h3>
              <p className="text-2xl font-bold text-red-600">3</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Demo erfolgreich geladen um {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}