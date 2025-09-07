import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusType = 'valid' | 'expiring' | 'expired' | 'missing';

interface StatusBadgeProps {
  status: StatusType;
  date?: string;
  className?: string;
}

const statusConfig = {
  valid: {
    label: 'Gültig',
    className: 'bg-success text-success-foreground hover:bg-success/80',
  },
  expiring: {
    label: 'Läuft ab',
    className: 'bg-warning text-warning-foreground hover:bg-warning/80',
  },
  expired: {
    label: 'Abgelaufen',
    className: 'bg-danger text-danger-foreground hover:bg-danger/80',
  },
  missing: {
    label: 'Fehlend',
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
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