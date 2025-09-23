import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'expiring_soon';
export type SubcontractorStatus = 'active' | 'inactive';

interface ComplianceStatusBadgeProps {
  complianceStatus: ComplianceStatus;
  subcontractorStatus: SubcontractorStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const complianceConfig = {
  compliant: {
    label: 'Aktuell Aktiv & Compliant',
    shortLabel: 'Aktiv', 
    className: 'bg-success text-success-foreground hover:bg-success/80',
    inactiveClassName: 'bg-muted text-muted-foreground hover:bg-muted/80',
    icon: CheckCircle,
    description: 'Alle Chargenpflichtigen Dokumente sind vollständig & gültig - automatisch aktiviert'
  },
  expiring_soon: {
    label: 'Dokumente laufen ab',
    shortLabel: 'Läuft ab',
    className: 'bg-warning text-warning-foreground hover:bg-warning/80',
    inactiveClassName: 'bg-muted text-muted-foreground hover:bg-muted/80',
    icon: Clock,
    description: 'Chargenpflichtige Dokumente laufen in den nächsten 30 Tagen ab - Reminder versandt'
  },
  non_compliant: {
    label: 'Nicht Aktiv - Dokumente fehlen',
    shortLabel: 'Inaktiv',
    className: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    inactiveClassName: 'bg-muted text-muted-foreground hover:bg-muted/80',
    icon: XCircle,
    description: 'Chargenpflichtige Dokumente fehlen oder sind abgelaufen - Projektassignment blockiert'
  }
};

const statusConfig = {
  active: {
    label: 'Aktiv',
    className: 'bg-success text-success-foreground hover:bg-success/80',
    icon: CheckCircle
  },
  inactive: {
    label: 'Inaktiv', 
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
    icon: XCircle
  }
};

export function ComplianceStatusBadge({ 
  complianceStatus, 
  subcontractorStatus,
  className,
  showIcon = true,
  size = 'md'
}: ComplianceStatusBadgeProps) {
  const complianceConf = complianceConfig[complianceStatus];
  const statusConf = statusConfig[subcontractorStatus];
  const isInactive = subcontractorStatus === 'inactive';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  // Use gray colors for inactive subcontractors
  const complianceClassName = isInactive ? complianceConf.inactiveClassName : complianceConf.className;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Badge 
        className={cn(complianceClassName, sizeClasses[size])}
        title={complianceConf.description}
      >
        {showIcon && <complianceConf.icon className="h-3 w-3 mr-1" />}
        {size === 'lg' ? complianceConf.label : complianceConf.shortLabel}
      </Badge>
      <Badge 
        variant="outline"
        className={cn(statusConf.className, sizeClasses.sm)}
      >
        {showIcon && <statusConf.icon className="h-3 w-3 mr-1" />}
        {statusConf.label}
      </Badge>
    </div>
  );
}

export function ComplianceIndicator({ 
  complianceStatus, 
  className 
}: { 
  complianceStatus: ComplianceStatus;
  className?: string;
}) {
  const config = complianceConfig[complianceStatus];
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center gap-2", className)} title={config.description}>
      <div className={cn(
        "w-3 h-3 rounded-full",
        complianceStatus === 'compliant' && "bg-success",
        complianceStatus === 'expiring_soon' && "bg-warning", 
        complianceStatus === 'non_compliant' && "bg-destructive"
      )} />
      <Icon className={cn(
        "h-4 w-4",
        complianceStatus === 'compliant' && "text-success",
        complianceStatus === 'expiring_soon' && "text-warning",
        complianceStatus === 'non_compliant' && "text-destructive"
      )} />
    </div>
  );
}