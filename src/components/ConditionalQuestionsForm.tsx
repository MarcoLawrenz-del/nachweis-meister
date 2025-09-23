import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ConditionalAnswers, 
  CONDITIONAL_QUESTIONS, 
  CondAnswer 
} from '@/config/conditionalQuestions';

interface ConditionalQuestionsFormProps {
  answers: ConditionalAnswers;
  onChange: (answers: ConditionalAnswers) => void;
  title?: string;
  description?: string;
  className?: string;
}

export function ConditionalQuestionsForm({
  answers,
  onChange,
  title = "Dokumentenanforderungen bestimmen",
  description = "Beantworten Sie diese Fragen, um zu ermitteln, welche Dokumente benötigt werden.",
  className
}: ConditionalQuestionsFormProps) {
  const handleAnswerChange = (questionId: keyof ConditionalAnswers, value: CondAnswer) => {
    const newAnswers = { ...answers };
    newAnswers[questionId] = value;
    
    // Wenn Q2 auf "no" oder "unknown" gesetzt wird, Q2a zurücksetzen
    if (questionId === 'doesConstructionWork' && value !== 'yes') {
      newAnswers.sokaBauSubject = undefined;
    }
    
    onChange(newAnswers);
  };

  const getVisibleQuestions = () => {
    return CONDITIONAL_QUESTIONS.filter(question => {
      if (!question.visibleIf) return true;
      return question.visibleIf(answers);
    });
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {getVisibleQuestions().map((question) => {
            const currentAnswer = answers[question.id];
            
            return (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{question.label}</h4>
                      {question.info && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{question.info}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {question.sublabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {question.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {question.options.map((option) => {
                    const isSelected = currentAnswer === option.value;
                    const isUnknown = option.value === 'unknown';
                    
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handleAnswerChange(question.id, option.value)}
                        className={`${
                          isUnknown && isSelected 
                            ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200" 
                            : ""
                        }`}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>

                {currentAnswer === 'unknown' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-xs text-amber-800">
                      Alles klar – wir setzen das Thema vorerst auf optional. Sie können das später ändern.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {getVisibleQuestions().length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Fragen verfügbar.
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Kompakte Variante für Dialoge
export function ConditionalQuestionsCompact({
  answers,
  onChange,
  className
}: Omit<ConditionalQuestionsFormProps, 'title' | 'description'>) {
  return (
    <ConditionalQuestionsForm
      answers={answers}
      onChange={onChange}
      title="Dokumentenanforderungen anpassen"
      description="Antworten beeinflussen, welche Dokumente als Pflicht, optional oder nicht angefordert gelten."
      className={className}
    />
  );
}

// Status-Badge für Dokumente mit "uncertain" Markierung
export function DocumentUncertaintyBadge({ 
  isUncertain, 
  className 
}: { 
  isUncertain: boolean; 
  className?: string; 
}) {
  if (!isUncertain) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`bg-amber-50 text-amber-700 border-amber-200 ${className}`}
    >
      Unklar – bitte prüfen
    </Badge>
  );
}