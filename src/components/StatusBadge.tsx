import { cn } from "@/lib/utils";

interface SimpleStatusBadgeProps {
  status: 'active' | 'inactive';
  className?: string;
}

export function SimpleStatusBadge({ status, className }: SimpleStatusBadgeProps) {
  const isActive = status === 'active';
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isActive 
        ? 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200' 
        : 'bg-surface-muted text-text-muted border border-border-muted'
    } ${className}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        isActive ? 'bg-brand-primary' : 'bg-text-muted'
      }`} />
      {isActive ? 'Aktiv' : 'Inaktiv'}
    </div>
  );
}

// Original StatusBadge for requirement statuses
import { Badge } from "@/components/ui/badge";
import { RequirementStatus } from "@/types/compliance";

export type StatusType = RequirementStatus | 'escalated' | 'uploaded';

interface StatusBadgeProps {
  status: StatusType;
  date?: string;
  className?: string;
}

const statusConfig = {
  missing: {
    label: 'Fehlend',
    className: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  submitted: {
    label: 'Eingereicht', 
    className: 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200',
  },
  uploaded: {
    label: 'Hochgeladen',
    className: 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200',
  },
  in_review: {
    label: 'In Prüfung',
    className: 'bg-brand-accent-100 text-brand-accent-700 border border-brand-accent-200',
  },
  valid: {
    label: 'Gültig',
    className: 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200',
  },
  rejected: {
    label: 'Abgelehnt',
    className: 'bg-brand-primary-800 text-white border border-brand-primary-800',
  },
  expiring: {
    label: 'Läuft ab',
    className: 'bg-brand-accent-100 text-brand-accent-700 border border-brand-accent-200',
  },
  expired: {
    label: 'Abgelaufen',
    className: 'bg-brand-primary-800 text-white border border-brand-primary-800',
  },
  escalated: {
    label: 'Eskaliert',
    className: 'bg-brand-accent-200 text-brand-accent-800 border border-brand-accent-300',
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