import React, { useState } from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getHelpInfo } from '@/config/helpLinks';

interface HelpTooltipProps {
  documentTypeCode: string;
  className?: string;
}

export default function HelpTooltip({ documentTypeCode, className = "" }: HelpTooltipProps) {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const helpInfo = getHelpInfo(documentTypeCode);

  // On mobile, show dialog instead of tooltip
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className={`h-6 w-6 p-0 text-muted-foreground hover:text-primary ${className}`}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                {helpInfo.title}
              </DialogTitle>
              <DialogDescription className="text-left pt-2">
                {helpInfo.content}
              </DialogDescription>
            </DialogHeader>
            {helpInfo.url && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full"
                >
                  <a 
                    href={helpInfo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Weitere Informationen
                  </a>
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Use tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 text-muted-foreground hover:text-primary ${className}`}
          >
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4">
          <div className="space-y-2">
            <p className="font-medium">{helpInfo.title}</p>
            <p className="text-sm">{helpInfo.content}</p>
            {helpInfo.url && (
              <Button
                variant="link"
                size="sm"
                asChild
                className="h-auto p-0 text-xs"
              >
                <a 
                  href={helpInfo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Weitere Informationen
                </a>
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}