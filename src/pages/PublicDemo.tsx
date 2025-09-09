import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  FolderOpen, 
  FileCheck, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings
} from "lucide-react";
import { Logo } from "@/components/Brand/Logo";
import { BRAND } from "@/config/brand";

// Demo-Daten für die öffentliche Ansicht
const demoStats = {
  totalSubcontractors: 12,
  totalProjects: 8,
  expiringSoon: 3,
  expired: 1,
  inReview: 5,
  approved: 15
};

const demoProjects = [
  {
    id: '1',
    name: 'Neubau Bürogebäude München',
    location: 'München, Bayern',
    start_date: '2024-01-15',
    end_date: '2024-12-30',
    status: 'active',
    compliance_status: 'compliant'
  },
  {
    id: '2', 
    name: 'Sanierung Industriehalle',
    location: 'Hamburg, Hamburg',
    start_date: '2024-03-01',
    end_date: '2024-09-15',
    status: 'active',
    compliance_status: 'expiring_soon'
  },
  {
    id: '3',
    name: 'Wohnanlage Köln-Süd',
    location: 'Köln, NRW',
    start_date: '2024-02-10',
    end_date: '2025-01-20',
    status: 'planning',
    compliance_status: 'non_compliant'
  }
];

const demoSubcontractors = [
  {
    id: '1',
    company_name: 'Bau & Montage GmbH',
    contact_person: 'Hans Mueller',
    email: 'h.mueller@bau-montage.de',
    phone: '+49 89 12345678',
    company_type: 'general_contractor',
    compliance_status: 'compliant'
  },
  {
    id: '2',
    company_name: 'ElektroTech Solutions',
    contact_person: 'Sarah Schmidt',
    email: 's.schmidt@elektrotech.de', 
    phone: '+49 40 87654321',
    company_type: 'electrical',
    compliance_status: 'expiring_soon'
  },
  {
    id: '3',
    company_name: 'Sanitär Pro',
    contact_person: 'Michael Weber',
    email: 'm.weber@sanitaer-pro.de',
    phone: '+49 221 55667788',
    company_type: 'plumbing',
    compliance_status: 'non_compliant'
  }
];

const demoCriticalItems = [
  {
    id: '1',
    document_type: 'Arbeitgeberhaftpflicht',
    company_name: 'ElektroTech Solutions',
    project_name: 'Neubau Bürogebäude München',
    due_date: '2024-12-31',
    status: 'expiring'
  },
  {
    id: '2',
    document_type: 'A1-Bescheinigung',
    company_name: 'Sanitär Pro', 
    project_name: 'Sanierung Industriehalle',
    due_date: '2024-11-15',
    status: 'expired'
  }
];

function PublicDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nachunternehmer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoStats.totalSubcontractors}</div>
            <p className="text-xs text-muted-foreground">Aktive Unternehmen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Laufende Projekte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritische Nachweise</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{demoStats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Laufen bald ab</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgelaufene Nachweise</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{demoStats.expired}</div>
            <p className="text-xs text-muted-foreground">Sofortige Aktion nötig</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kritische Nachweise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoCriticalItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{item.document_type}</p>
                  <p className="text-sm text-muted-foreground">{item.company_name} • {item.project_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'expired' ? 'destructive' : 'secondary'}>
                    {item.status === 'expired' ? 'Abgelaufen' : 'Läuft ab'}
                  </Badge>
                  <span className="text-sm">{item.due_date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PublicProjects() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success/10 text-success border-success/20">Aktiv</Badge>;
      case 'planning': return <Badge className="bg-primary/10 text-primary border-primary/20">Planung</Badge>;
      case 'completed': return <Badge className="bg-muted text-muted-foreground border-border">Abgeschlossen</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Konform</Badge>;
      case 'expiring_soon': return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Läuft ab</Badge>;
      case 'non_compliant': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Nicht konform</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projekte</h2>
        <Button>Neues Projekt</Button>
      </div>
      
      <div className="grid gap-6">
        {demoProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-muted-foreground">{project.location}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(project.status)}
                  {getComplianceBadge(project.compliance_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Start: {project.start_date}</span>
                <span>Ende: {project.end_date}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PublicSubcontractors() {
  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Konform</Badge>;
      case 'expiring_soon': return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Läuft ab</Badge>;
      case 'non_compliant': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Nicht konform</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getCompanyTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      general_contractor: 'Generalunternehmer',
      electrical: 'Elektro',
      plumbing: 'Sanitär',
      hvac: 'HLK',
      other: 'Sonstige'
    };
    return <Badge variant="outline">{types[type] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Nachunternehmer</h2>
        <Button>Neuer Nachunternehmer</Button>
      </div>
      
      <div className="grid gap-6">
        {demoSubcontractors.map((contractor) => (
          <Card key={contractor.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{contractor.company_name}</CardTitle>
                  <p className="text-muted-foreground">{contractor.contact_person}</p>
                </div>
                <div className="flex gap-2">
                  {getCompanyTypeBadge(contractor.company_type)}
                  {getComplianceBadge(contractor.compliance_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">E-Mail</p>
                  <p>{contractor.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p>{contractor.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PublicDemo() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Public Demo Header */}
      <div className="bg-primary text-primary-foreground p-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <Logo width={160} height={48} />
          <div>
            <p className="text-sm opacity-90">Vollständige App-Funktionalität ohne Login • Alle Daten sind Beispieldaten</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Projekte
              </TabsTrigger>
              <TabsTrigger value="subcontractors" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Nachunternehmer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="dashboard">
            <PublicDashboard />
          </TabsContent>
          <TabsContent value="projects">
            <PublicProjects />
          </TabsContent>
          <TabsContent value="subcontractors">
            <PublicSubcontractors />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Info */}
      <div className="border-t bg-muted/30 p-4 mt-12">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>🎯 Öffentliche Demo der {BRAND.name} App</p>
          <p>Verfügbare Bereiche: Dashboard, Projekte, {BRAND.terms.subcontractor}, Compliance-Management</p>
          <p className="mt-2">URL: <code>{window.location.href}</code></p>
        </div>
      </div>
    </div>
  );
}