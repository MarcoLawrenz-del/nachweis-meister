import { Button } from "@/components/ui/button";
import { Upload, Save, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyUploadFooterProps {
  isSubmitting: boolean;
  hasNewFiles: boolean;
  onSave: () => void;
  className?: string;
}

export function StickyUploadFooter({ 
  isSubmitting, 
  hasNewFiles, 
  onSave, 
  className 
}: StickyUploadFooterProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50",
      className
    )}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>💡 Sie können diesen Link jederzeit erneut öffnen</p>
            <p className="text-xs">Ihre Daten sind sicher verschlüsselt (SSL)</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Später fortfahren
            </Button>
            
            <Button 
              onClick={onSave}
              disabled={isSubmitting || !hasNewFiles}
              size="lg"
              className="min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Uploads speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}