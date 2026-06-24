import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "src/lib/utils";

const inputClasses =
  "flex h-9 w-full rounded-md border border-input bg-input-bg px-3 py-1 text-sm text-input-foreground transition-colors placeholder:text-input-foreground/50 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/40";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(inputClasses, className)}
    {...props}
  />
));
Input.displayName = "Input";

export { inputClasses };
