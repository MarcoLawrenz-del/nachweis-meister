import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useReviews } from '@/hooks/useReviews';

interface ReviewerAssignmentProps {
  requirementId: string;
  currentReviewerId?: string;
  tenantId: string;
  onAssignmentComplete?: () => void;
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const ReviewerAssignment = ({ 
  requirementId, 
  currentReviewerId, 
  tenantId, 
  onAssignmentComplete 
}: ReviewerAssignmentProps) => {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState(currentReviewerId || '');
  const { assignReviewer, isLoading } = useReviews();

  useEffect(() => {
    fetchReviewers();
  }, [tenantId]);

  const fetchReviewers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('tenant_id', tenantId)
        .in('role', ['owner', 'admin', 'staff'])
        .order('name');

      if (error) throw error;
      setReviewers(data || []);
    } catch (error) {
      console.error('Error fetching reviewers:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedReviewer) return;
    
    await assignReviewer(requirementId, selectedReviewer);
    onAssignmentComplete?.();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Prüfer zuweisen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Prüfer auswählen
          </label>
          <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
            <SelectTrigger>
              <SelectValue placeholder="Prüfer auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {reviewers.map((reviewer) => (
                <SelectItem key={reviewer.id} value={reviewer.id}>
                  <div className="flex flex-col">
                    <span>{reviewer.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {reviewer.email} • {reviewer.role}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleAssign}
          disabled={!selectedReviewer || isLoading || selectedReviewer === currentReviewerId}
          className="w-full"
        >
          {isLoading ? 'Wird zugewiesen...' : 'Prüfer zuweisen'}
        </Button>
      </CardContent>
    </Card>
  );
};