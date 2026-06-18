import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "src/lib/utils";

const alertVariants = cva("rounded-md border px-4 py-3 text-foreground", {
  variants: {
    variant: {
      primary: "border-primary/40 bg-primary/15",
      secondary: "border-border bg-secondary",
      warning: "border-warning/40 bg-warning/15",
      danger: "border-destructive/40 bg-destructive/15",
      success: "border-success/40 bg-success/15",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = ({ className, variant, ...props }: AlertProps) => (
  <div className={cn(alertVariants({ variant }), className)} {...props} />
);
