import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RequirementStatus } from "@/types/compliance";

export type StatusType = RequirementStatus | 'escalated';

interface StatusBadgeProps {
  status: StatusType;
  date?: string;
  className?: string;
}

const statusConfig = {
  missing: {
    label: 'Fehlend',
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
  },
  submitted: {
    label: 'Eingereicht',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  in_review: {
    label: 'In Prüfung',
    className: 'bg-blue-200 text-blue-900 hover:bg-blue-300',
  },
  valid: {
    label: 'Gültig',
    className: 'bg-success text-success-foreground hover:bg-success/80',
  },
  rejected: {
    label: 'Abgelehnt',
    className: 'bg-danger text-danger-foreground hover:bg-danger/80',
  },
  expiring: {
    label: 'Läuft ab',
    className: 'bg-warning text-warning-foreground hover:bg-warning/80',
  },
  expired: {
    label: 'Abgelaufen',
    className: 'bg-danger text-danger-foreground hover:bg-danger/80',
  },
  escalated: {
    label: 'Eskaliert',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  },
};

export function StatusBadge({ status, date, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant="secondary" 
        className={cn(config.className, className)}
      >
        {config.label}
      </Badge>
      {date && (
        <span className="text-xs text-muted-foreground">
          {date}
        </span>
      )}
    </div>
  );
}