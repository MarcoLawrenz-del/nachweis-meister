import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium select-none border " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
  "antialiased no-underline align-middle will-change-[color,box-shadow] " +
  "transform-none transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-brand-on-primary border-transparent shadow-sm hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground border-transparent shadow-sm hover:shadow-md",
        outline: "bg-background text-foreground border-border hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground border-transparent shadow-sm hover:shadow-md",
        ghost: "bg-transparent text-foreground border-transparent hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border-transparent",
      },
      size: {
        default: "h-11 px-4 text-base leading-[1.2]",
        sm: "h-9 px-3 text-sm leading-[1.2]", 
        lg: "h-12 px-5 text-base leading-[1.2]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
