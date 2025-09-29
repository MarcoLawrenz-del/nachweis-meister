import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Search, FileText, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ReviewItem {
  id: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  document_types: {
    name_de: string;
    code: string;
  };
  project_subs: {
    id: string;
    subcontractor_id: string;
    subcontractors: {
      company_name: string;
    };
  };
  documents: Array<{
    id: string;
    file_name: string;
    uploaded_at: string;
  }>;
}

export default function ReviewQueue() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReviewItems();
  }, []);

  const loadReviewItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          id,
          status,
          due_date,
          updated_at,
          document_types (
            name_de,
            code
          ),
          project_subs (
            id,
            subcontractor_id,
            subcontractors (
              company_name
            )
          ),
          documents (
            id,
            file_name,
            uploaded_at
          )
        `)
        .in('status', ['in_review', 'submitted'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setReviewItems(data || []);
    } catch (error) {
      console.error('Error loading review items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = reviewItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.document_types.name_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project_subs.subcontractors.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_review':
        return (
          <Badge variant="secondary">
            <Eye className="h-3 w-3 mr-1" />
            In Prüfung
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Eingereicht
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (dueDate: string | null) => {
    if (!dueDate) return '';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600'; // Überfällig
    if (diffDays <= 7) return 'text-orange-600'; // Urgent
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Prüfungsqueue</h1>
          <p className="text-muted-foreground">
            Dokumente zur Überprüfung ({filteredItems.length})
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Nach Dokumenttyp oder Nachunternehmer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="submitted">Eingereicht</SelectItem>
                <SelectItem value="in_review">In Prüfung</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Review Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Zu prüfende Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-muted-foreground">Lade Prüfungsqueue...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Keine Dokumente gefunden, die den Filtern entsprechen.'
                  : 'Keine Dokumente zur Prüfung vorhanden.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokumenttyp</TableHead>
                  <TableHead>Nachunternehmer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fällig</TableHead>
                  <TableHead>Eingereicht</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.document_types.name_de}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/app/subcontractors/${item.project_subs.subcontractor_id}`}
                        className="text-primary hover:underline"
                      >
                        {item.project_subs.subcontractors.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      {item.due_date ? (
                        <span className={getPriorityColor(item.due_date)}>
                          {format(new Date(item.due_date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.documents.length > 0 
                        ? format(new Date(item.documents[0].uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/subcontractors/${item.project_subs.subcontractor_id}?tab=documents`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Prüfen
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}