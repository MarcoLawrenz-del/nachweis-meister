import { LegalComplianceDashboard } from '@/components/LegalComplianceDashboard';

export default function ComplianceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-professional">Rechtliche Compliance</h1>
        <p className="text-muted-foreground">
          Überblick über die rechtliche Compliance aller Nachunternehmer nach deutschem Baurecht
        </p>
      </div>
      
      <LegalComplianceDashboard />
    </div>
  );
}