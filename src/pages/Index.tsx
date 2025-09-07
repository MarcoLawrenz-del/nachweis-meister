import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { DashboardStats } from '@/components/DashboardStats';
import { mockSubcontractors } from '@/data/mockData';
import { DOCUMENT_TYPES, Subcontractor } from '@/types';
import { 
  Plus, 
  Search, 
  Building, 
  Phone, 
  Mail,
  AlertTriangle,
  FileText
} from 'lucide-react';

const Index = () => {
  const [subcontractors] = useState<Subcontractor[]>(mockSubcontractors);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubcontractors = subcontractors.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalIssues = subcontractors.filter(sub => 
    Object.values(sub.documents).some(doc => doc.status === 'expired' || doc.status === 'expiring')
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-professional">
                Nachunternehmer-Verwaltung
              </h1>
              <p className="text-muted-foreground">
                Verwalten Sie alle pflichtrelevanten Nachweise Ihrer Subunternehmer
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Neuer Nachunternehmer
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Stats */}
        <DashboardStats subcontractors={subcontractors} />

        {/* Critical Issues Alert */}
        {criticalIssues.length > 0 && (
          <Card className="border-danger/20 bg-danger/5">
            <CardHeader>
              <CardTitle className="flex items-center text-danger">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Kritische Nachweise ({criticalIssues.length})
              </CardTitle>
              <CardDescription>
                Diese Nachunternehmer haben abgelaufene oder bald ablaufende Dokumente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalIssues.slice(0, 3).map(sub => {
                  const expiredDocs = Object.entries(sub.documents)
                    .filter(([, doc]) => doc.status === 'expired' || doc.status === 'expiring')
                    .map(([key]) => DOCUMENT_TYPES[key as keyof typeof DOCUMENT_TYPES]);
                  
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                      <div>
                        <p className="font-medium">{sub.company}</p>
                        <p className="text-sm text-muted-foreground">{sub.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-danger">
                          {expiredDocs.length} kritische Dokumente
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expiredDocs[0]} {expiredDocs.length > 1 && `+ ${expiredDocs.length - 1} weitere`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subcontractors Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Nachunternehmer Übersicht
                </CardTitle>
                <CardDescription>
                  Alle registrierten Subunternehmer und deren Nachweis-Status
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead className="text-center">§48b EStG</TableHead>
                  <TableHead className="text-center">§13b UStG</TableHead>
                  <TableHead className="text-center">SOKA-BAU</TableHead>
                  <TableHead className="text-center">BG BAU</TableHead>
                  <TableHead className="text-center">Handwerk</TableHead>
                  <TableHead className="text-center">A1</TableHead>
                  <TableHead className="text-center">Haftpflicht</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubcontractors.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.company}</p>
                        <p className="text-sm text-muted-foreground">{sub.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-2 h-3 w-3" />
                          {sub.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="mr-2 h-3 w-3" />
                          {sub.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.freistellungsbescheinigung.status}
                        date={sub.documents.freistellungsbescheinigung.expiryDate}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.umsatzsteuer.status}
                        date={sub.documents.umsatzsteuer.expiryDate}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.sokaBau.status}
                        date={sub.documents.sokaBau.expiryDate}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.bgBau.status}
                        date={sub.documents.bgBau.expiryDate}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.handwerksrolle.status}
                        date={sub.documents.handwerksrolle.expiryDate}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.a1Bescheinigung.status}
                        date={sub.documents.a1Bescheinigung.expiryDate}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge 
                        status={sub.documents.betriebshaftpflicht.status}
                        date={sub.documents.betriebshaftpflicht.expiryDate}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Bearbeiten
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;