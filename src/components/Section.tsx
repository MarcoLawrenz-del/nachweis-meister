// ============= Section Component =============
// Consistent spacing and container for guide sections

import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section 
      id={id}
      className={cn(
        "py-10 md:py-14 space-y-6 md:space-y-8",
        className
      )}
    >
      {children}
    </section>
  );
}