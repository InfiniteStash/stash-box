import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "src/lib/utils";

// Lightweight form-group primitives. Pair with react-hook-form: pass the field
// error message into FieldError and it renders only when present.
export const FormGroup = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 flex flex-col gap-1.5", className)} {...props} />
);

export const Label = ({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: generic primitive; callers supply htmlFor
  <label
    className={cn("text-sm font-medium text-foreground", className)}
    {...props}
  />
);

export const FieldError = ({ children }: { children?: ReactNode }) =>
  children ? <div className="text-sm text-destructive">{children}</div> : null;
