import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[20px] text-sm font-bold tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.92] active:shadow-clayPressed",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton hover:-translate-y-1 hover:shadow-clayButtonHover",
        destructive:
          "bg-gradient-to-br from-red-400 to-destructive text-destructive-foreground shadow-clayButton hover:-translate-y-1 hover:shadow-clayButtonHover",
        outline:
          "border-2 border-primary/20 bg-transparent text-primary hover:border-primary hover:bg-primary/5 hover:-translate-y-1",
        secondary:
          "bg-card text-foreground shadow-clayCard hover:-translate-y-1 hover:shadow-clayCardHover",
        ghost:
          "text-foreground hover:bg-primary/10 hover:text-primary rounded-clay-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 px-8 py-2",
        sm: "h-11 px-5",
        lg: "h-16 px-10 text-base",
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
