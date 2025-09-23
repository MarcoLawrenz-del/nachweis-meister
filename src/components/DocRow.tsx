// ============= Document Row Component =============
// Accordion-based document display with tabs

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Clock,
  HelpCircle,
  ExternalLink,
  FileUp,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocInfo } from '@/config/docsCatalog';
import { getValidityText, PACKAGE_NAMES, REQUIREMENT_LABELS } from '@/config/docsCatalog';

interface DocRowProps {
  doc: DocInfo;
  isOpen: boolean;
  onToggle: () => void;
}

export function DocRow({ doc, isOpen, onToggle }: DocRowProps) {
  const getRequirementBadge = (requirement: string, note?: string) => {
    const variants = {
      pflicht: 'bg-amber-100 text-amber-800 border-amber-200',
      optional: 'bg-neutral-100 text-neutral-700 border-neutral-200', 
      konditional: 'bg-blue-100 text-blue-800 border-blue-200'
    } as const;

    const variant = variants[requirement as keyof typeof variants] || 'bg-neutral-100 text-neutral-700 border-neutral-200';
    const label = REQUIREMENT_LABELS[requirement as keyof typeof REQUIREMENT_LABELS] || requirement;

    return (
      <Badge 
        variant="outline" 
        className={cn("text-xs h-5 px-2 border", variant)}
      >
        {label}{note && ` (${note})`}
      </Badge>
    );
  };

  const getValidityDisplay = () => {
    switch (doc.validity.type) {
      case "fixed":
        return `${doc.validity.defaultMonths} Monate`;
      case "does_not_expire":
        return "läuft nicht ab";
      case "unknown_ok":
        return "flexibel";
      default:
        return "individuell";
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={onToggle}
      className="rounded-xl border bg-card hover:bg-accent/30 transition-colors"
    >
      <CollapsibleTrigger className="w-full">
        <div className="p-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-base md:text-lg font-medium mb-1 leading-tight">
                {doc.title}
              </h4>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {doc.short}
              </p>
              <div className="flex flex-wrap gap-2">
                {doc.packages.map((pkg, i) => (
                  <div key={i} className="flex items-center gap-1 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className="text-xs h-5 px-2 bg-muted/50"
                    >
                      {PACKAGE_NAMES[pkg.pkg]}
                    </Badge>
                    {getRequirementBadge(pkg.requirement, pkg.note)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {getValidityDisplay()}
                </div>
              </div>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )} 
              />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-5 pb-5">
          <Tabs defaultValue="when-required" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="when-required" className="text-xs">
                Wann Pflicht?
              </TabsTrigger>
              <TabsTrigger value="how-to-get" className="text-xs">
                So erhalten
              </TabsTrigger>
              <TabsTrigger value="upload-tips" className="text-xs">
                Upload-Tipps
              </TabsTrigger>
            </TabsList>

            <TabsContent value="when-required" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Wann ist dieses Dokument Pflicht?
                </div>
                <p className="text-sm text-muted-foreground leading-6">
                  {doc.whenRequired}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="how-to-get" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Offizielle Quellen
                </div>
                <div className="space-y-2">
                  {doc.howToGet.slice(0, 3).map((source, i) => (
                    <a 
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline group"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span>{source.label}</span>
                      <span className="sr-only">(extern)</span>
                    </a>
                  ))}
                  {doc.howToGet.length > 3 && (
                    <Button variant="ghost" size="sm" className="h-6 p-1 text-xs">
                      + {doc.howToGet.length - 3} weitere Quellen
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload-tips" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileUp className="h-4 w-4 text-primary" />
                  Tipps für den Upload
                </div>
                <ul className="space-y-2">
                  {doc.uploadTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span className="leading-6">{tip}</span>
                    </li>
                  ))}
                </ul>
                
                {doc.legalRefs && doc.legalRefs.length > 0 && (
                  <div className="pt-3 mt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      Quellen:
                      {doc.legalRefs.map((ref, i) => (
                        <span key={i}>
                          <a 
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {ref.label}
                          </a>
                          {i < doc.legalRefs!.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}