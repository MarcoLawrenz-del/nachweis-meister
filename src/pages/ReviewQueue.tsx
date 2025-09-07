import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Building2,
  Calendar,
  Download,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReviewItem {
  id: string;
  requirement_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  valid_from: string | null;
  valid_to: string | null;
  company_name: string;
  project_name: string;
  document_type: string;
  contact_email: string;
}

export default function ReviewQueue() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ReviewItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { profile } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchReviewItems();
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    const filtered = reviewItems.filter(item =>
      item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [reviewItems, searchTerm]);

  const fetchReviewItems = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          requirement_id,
          file_name,
          file_url,
          file_size,
          uploaded_at,
          valid_from,
          valid_to,
          requirements!inner (
            id,
            status,
            project_subs!inner (
              projects!inner (
                name,
                tenant_id
              ),
              subcontractors!inner (
                company_name,
                contact_email
              )
            ),
            document_types!inner (
              name_de
            )
          )
        `)
        .eq('requirements.status', 'in_review')
        .eq('requirements.project_subs.projects.tenant_id', profile.tenant_id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const processedItems = data?.map((doc: any) => ({
        id: doc.id,
        requirement_id: doc.requirement_id,
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_size: doc.file_size,
        uploaded_at: doc.uploaded_at,
        valid_from: doc.valid_from,
        valid_to: doc.valid_to,
        company_name: doc.requirements.project_subs.subcontractors.company_name,
        project_name: doc.requirements.project_subs.projects.name,
        document_type: doc.requirements.document_types.name_de,
        contact_email: doc.requirements.project_subs.subcontractors.contact_email
      })) || [];

      setReviewItems(processedItems);
    } catch (error) {
      console.error('Error fetching review items:', error);
      toast({
        title: "Fehler",
        description: "Prüfungsqueue konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ReviewItem) => {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('requirements')
        .update({ 
          status: 'valid',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.requirement_id);

      if (error) throw error;

      toast({
        title: "Dokument genehmigt",
        description: `${item.document_type} für ${item.company_name} wurde genehmigt.`
      });

      fetchReviewItems();
    } catch (error: any) {
      console.error('Error approving document:', error);
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht genehmigt werden.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('requirements')
        .update({ 
          status: 'missing',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.requirement_id);

      if (error) throw error;

      toast({
        title: "Dokument abgelehnt",
        description: `${selectedItem.document_type} für ${selectedItem.company_name} wurde abgelehnt.`
      });

      setSelectedItem(null);
      setRejectionReason('');
      fetchReviewItems();
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      toast({
        title: "Fehler",
        description: "Dokument konnte nicht abgelehnt werden.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDaysUntilExpiry = (validTo: string | null) => {
    if (!validTo) return null;
    const days = Math.ceil((new Date(validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-professional">Prüfungsqueue</h1>
          <p className="text-muted-foreground">
            Dokumente zur Prüfung und Freigabe ({filteredItems.length})
          </p>
        </div>
      </div>

      {/* Review Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Zu prüfende Dokumente
              </CardTitle>
              <CardDescription>
                Hochgeladene Dokumente warten auf Ihre Prüfung und Freigabe
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Dokumente durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {reviewItems.length === 0 ? 'Keine Dokumente zur Prüfung' : 'Keine Treffer'}
              </h3>
              <p className="text-muted-foreground">
                {reviewItems.length === 0 
                  ? "Alle hochgeladenen Dokumente wurden bereits geprüft."
                  : "Ihre Suche ergab keine Treffer. Versuchen Sie andere Suchbegriffe."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokument</TableHead>
                  <TableHead>Nachunternehmer</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Gültigkeit</TableHead>
                  <TableHead>Hochgeladen</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const daysUntilExpiry = getDaysUntilExpiry(item.valid_to);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.document_type}</p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <FileText className="h-3 w-3 mr-1" />
                            {item.file_name}
                            <span className="ml-2">({formatFileSize(item.file_size)})</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.company_name}</p>
                          <p className="text-sm text-muted-foreground">{item.contact_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          {item.project_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.valid_from || item.valid_to ? (
                          <div className="text-sm">
                            {item.valid_from && (
                              <div>Ab: {format(new Date(item.valid_from), 'dd.MM.yyyy', { locale: de })}</div>
                            )}
                            {item.valid_to && (
                              <div className={daysUntilExpiry && daysUntilExpiry < 30 ? 'text-warning' : ''}>
                                Bis: {format(new Date(item.valid_to), 'dd.MM.yyyy', { locale: de })}
                                {daysUntilExpiry !== null && (
                                  <span className="ml-1">
                                    ({daysUntilExpiry > 0 ? `${daysUntilExpiry}d` : 'Abgelaufen'})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nicht angegeben</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(new Date(item.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-2" />
                              Ansehen
                            </a>
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(item)}
                            disabled={actionLoading}
                            className="bg-success text-success-foreground hover:bg-success/90"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Genehmigen
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Ablehnen
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Dokument ablehnen</DialogTitle>
                                <DialogDescription>
                                  Geben Sie einen Grund für die Ablehnung von "{item.document_type}" an.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejection_reason">Grund für die Ablehnung *</Label>
                                  <Textarea
                                    id="rejection_reason"
                                    placeholder="z.B. Dokument ist nicht lesbar, falscher Dokumenttyp, abgelaufen..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedItem(null);
                                    setRejectionReason('');
                                  }}
                                >
                                  Abbrechen
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={handleReject}
                                  disabled={!rejectionReason.trim() || actionLoading}
                                >
                                  Ablehnen
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}