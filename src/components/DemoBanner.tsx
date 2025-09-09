import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye } from "lucide-react";
import { AccessibleIcon } from "@/components/AccessibleIcon";
import { DemoResetButton } from "./DemoResetButton";

export function DemoBanner() {
  return (
    <Alert className="bg-brand-accent/10 border-brand-accent/30 text-foreground mb-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <AccessibleIcon icon={Eye} />
          <AlertDescription className="font-medium">
            <span className="text-brand-accent font-bold">Demo-Modus</span> • Diese Anwendung ist schreibgeschützt. Alle Daten werden täglich zurückgesetzt.
          </AlertDescription>
        </div>
        <DemoResetButton />
      </div>
    </Alert>
  );
}