import type { TableHTMLAttributes } from "react";
import { cn } from "src/lib/utils";

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
}

// Styled native table. Use with native thead/tbody/tr/th/td children.
export const Table = ({ className, striped, ...props }: TableProps) => (
  <table
    className={cn(
      "w-full text-left text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_thead]:border-b [&_thead]:border-border [&_tbody_tr]:border-b [&_tbody_tr]:border-border/50",
      striped && "[&_tbody_tr:nth-child(even)]:bg-secondary/30",
      className,
    )}
    {...props}
  />
);
