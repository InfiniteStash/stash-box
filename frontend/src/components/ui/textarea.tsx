import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "src/lib/utils";

const textareaClasses =
  "flex min-h-20 w-full rounded-md border border-input bg-input-bg px-3 py-2 text-sm text-input-foreground transition-colors placeholder:text-input-foreground/50 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/40";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaClasses, className)} {...props} />
));
Textarea.displayName = "Textarea";
