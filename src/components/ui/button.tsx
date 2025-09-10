import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium select-none border " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))] " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
  "antialiased no-underline align-middle transition-colors duration-200 " +
  "transform-none filter-none text-shadow-none",
  {
    variants: {
      variant: {
        primary: "bg-[hsl(var(--brand))] text-[hsl(var(--brand-on))] border-transparent shadow-sm hover:shadow-md",
        secondary: "bg-[hsl(var(--surface))] text-[hsl(var(--text))] border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]",
        ghost: "bg-transparent text-[hsl(var(--text))] border-transparent hover:bg-[hsl(var(--surface-2))]",
        destructive: "bg-destructive text-destructive-foreground border-transparent shadow-sm hover:shadow-md",
        outline: "bg-background text-foreground border-border hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border-transparent",
      },
      size: {
        sm: "h-9 px-3 text-sm leading-[1.2]",
        md: "h-11 px-4 text-base leading-[1.2]",
        lg: "h-12 px-5 text-base leading-[1.2]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
