import { LegalComplianceDashboard } from '@/components/LegalComplianceDashboard';

export default function ComplianceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-professional">Rechtliche Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Bausicht-konforme Übersicht aller Nachunternehmer mit Ampelsystem: 
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="w-2 h-2 rounded-full bg-success"></span> aktiv |
            <span className="w-2 h-2 rounded-full bg-destructive ml-1"></span> fehlt etwas/abgelaufen
          </span>
        </p>
      </div>
      
      <LegalComplianceDashboard />
    </div>
  );
}