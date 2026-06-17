import { cn } from "src/lib/utils";

export const Spinner = ({ className }: { className?: string }) => (
  <div
    role="status"
    className={cn(
      "inline-block size-8 animate-spin rounded-full border-[3px] border-current border-t-transparent text-primary",
      className,
    )}
  >
    <span className="sr-only">Loading...</span>
  </div>
);
