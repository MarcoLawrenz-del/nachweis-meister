import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BRAND } from "@/config/brand";

interface BrandedButtonProps extends React.ComponentProps<typeof Button> {
  branded?: boolean;
}

export function BrandedButton({ branded = false, className, children, ...props }: BrandedButtonProps) {
  if (branded) {
    return (
      <Button 
        className={cn(
          "bg-brand-primary hover:bg-brand-primary/90 text-white border-brand-primary",
          className
        )} 
        {...props}
      >
        {children}
      </Button>
    );
  }
  
  return (
    <Button className={className} {...props}>
      {children}
    </Button>
  );
}