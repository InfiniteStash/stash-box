import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "src/lib/utils";

// Styled native <select> for simple enum dropdowns. Keeps the native combobox
// role so it stays accessible and form-native. Rich async pickers use the Base
// UI Combobox instead (see Phase 3).
const selectClasses =
  "flex h-9 w-full rounded-md border border-input bg-input-bg px-3 py-1 text-sm text-input-foreground transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(selectClasses, className)} {...props} />
));
Select.displayName = "Select";
