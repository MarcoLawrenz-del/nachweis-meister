import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Eye,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { RequirementWithDocument } from '@/hooks/useSubcontractorProfile';
import { RequirementStatus } from '@/types/compliance';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DocumentsTabProps {
  requirements: RequirementWithDocument[];
  onAction: (action: string, requirementId: string) => void;
}

export function DocumentsTab({ requirements, onAction }: DocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mandatory' | 'optional'>('all');

  // Filter requirements
  const filteredRequirements = requirements.filter(req => {
    // Search filter
    const matchesSearch = req.document_types.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.document_types.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'mandatory' && req.document_types.required_by_default) ||
                       (typeFilter === 'optional' && !req.document_types.required_by_default);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Status configuration
  const getStatusConfig = (status: RequirementStatus) => {
    const configs = {
      missing: { 
        label: 'Fehlend', 
        variant: 'outline' as const, 
        icon: XCircle, 
        className: 'text-red-600 border-red-200' 
      },
      submitted: { 
        label: 'Eingereicht', 
        variant: 'outline' as const, 
        icon: Upload, 
        className: 'text-blue-600 border-blue-200' 
      },
      in_review: { 
        label: 'In Prüfung', 
        variant: 'outline' as const, 
        icon: Clock, 
        className: 'text-blue-800 border-blue-300' 
      },
      valid: { 
        label: 'Gültig', 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      rejected: { 
        label: 'Abgelehnt', 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800' 
      },
      expiring: { 
        label: 'Läuft ab', 
        variant: 'outline' as const, 
        icon: AlertTriangle, 
        className: 'text-yellow-600 border-yellow-200' 
      },
      expired: { 
        label: 'Abgelaufen', 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        className: 'bg-red-100 text-red-800' 
      }
    };
    
    return configs[status];
  };

  // Get available actions for each requirement
  const getActions = (requirement: RequirementWithDocument) => {
    const actions = [];
    
    switch (requirement.status) {
      case 'missing':
        actions.push({
          label: 'Upload anfordern',
          action: () => onAction('request_upload', requirement.id),
          variant: 'default' as const
        });
        break;
        
      case 'submitted':
      case 'in_review':
        actions.push({
          label: 'Prüfen',
          action: () => onAction('review', requirement.id),
          variant: 'outline' as const
        });
        break;
        
      case 'valid':
        if (requirement.documents.length > 0) {
          actions.push({
            label: 'Anzeigen',
            action: () => onAction('view_document', requirement.id),
            variant: 'ghost' as const
          });
        }
        break;
        
      case 'rejected':
        actions.push({
          label: 'Korrektur anfordern',
          action: () => onAction('request_correction', requirement.id),
          variant: 'outline' as const
        });
        break;
        
      case 'expiring':
        actions.push({
          label: 'Verlängerung anfordern',
          action: () => onAction('request_renewal', requirement.id),
          variant: 'outline' as const
        });
        if (requirement.documents.length > 0) {
          actions.push({
            label: 'Anzeigen',
            action: () => onAction('view_document', requirement.id),
            variant: 'ghost' as const
          });
        }
        break;
        
      case 'expired':
        actions.push({
          label: 'Neu anfordern',
          action: () => onAction('request_upload', requirement.id),
          variant: 'default' as const
        });
        break;
    }
    
    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Dokumenttyp suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="missing">Fehlend</SelectItem>
                <SelectItem value="submitted">Eingereicht</SelectItem>
                <SelectItem value="in_review">In Prüfung</SelectItem>
                <SelectItem value="valid">Gültig</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="expiring">Läuft ab</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="mandatory">Pflichtdokumente</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumente ({filteredRequirements.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokumenttyp</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead>Hochgeladen</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequirements.map((requirement) => {
                const statusConfig = getStatusConfig(requirement.status);
                const actions = getActions(requirement);
                const StatusIcon = statusConfig.icon;
                const latestDocument = requirement.documents[0]; // Most recent document

                return (
                  <TableRow key={requirement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{requirement.document_types.name_de}</div>
                        <div className="text-sm text-muted-foreground">
                          {requirement.document_types.code}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={requirement.document_types.required_by_default ? 'default' : 'outline'}>
                        {requirement.document_types.required_by_default ? 'Pflicht' : 'Optional'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={statusConfig.variant} className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {requirement.rejection_reason && (
                        <div className="text-sm text-red-600 mt-1">
                          {requirement.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {requirement.valid_to ? (
                        <div className="text-sm">
                          {format(new Date(requirement.valid_to), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {latestDocument ? (
                        <div className="text-sm">
                          <div>{format(new Date(latestDocument.uploaded_at), 'dd.MM.yyyy', { locale: de })}</div>
                          <div className="text-muted-foreground truncate max-w-[150px]">
                            {latestDocument.file_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        {actions.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant}
                            size="sm"
                            onClick={action.action}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredRequirements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Keine Dokumente gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}