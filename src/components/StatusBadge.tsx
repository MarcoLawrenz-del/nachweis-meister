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
  isInactive?: boolean;
}

const statusConfig = {
  missing: {
    label: 'Fehlend',
    className: 'bg-surface-muted text-text-muted border border-border-muted',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  submitted: {
    label: 'Eingereicht', 
    className: 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  uploaded: {
    label: 'Hochgeladen',
    className: 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  in_review: {
    label: 'In Prüfung',
    className: 'bg-brand-accent-100 text-brand-accent-700 border border-brand-accent-200',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  valid: {
    label: 'Gültig',
    className: 'bg-brand-primary-100 text-brand-primary-700 border border-brand-primary-200',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  rejected: {
    label: 'Abgelehnt',
    className: 'bg-brand-primary-800 text-white border border-brand-primary-800',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  expiring: {
    label: 'Läuft ab',
    className: 'bg-brand-accent-100 text-brand-accent-700 border border-brand-accent-200',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  expired: {
    label: 'Abgelaufen',
    className: 'bg-brand-primary-800 text-white border border-brand-primary-800',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
  escalated: {
    label: 'Eskaliert',
    className: 'bg-brand-accent-200 text-brand-accent-800 border border-brand-accent-300',
    inactiveClassName: 'bg-surface-muted text-text-muted border border-border-muted',
  },
};

export function StatusBadge({ status, date, className, isInactive = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  const badgeClassName = isInactive ? config.inactiveClassName : config.className;
  
  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant="secondary" 
        className={cn(badgeClassName, className)}
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