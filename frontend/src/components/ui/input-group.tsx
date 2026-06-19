import type { HTMLAttributes } from "react";
import { cn } from "src/lib/utils";

// Joins adjacent controls (Input / Select / Button) into one connected widget,
// like Bootstrap's InputGroup: inner radii are flattened, borders merged by a
// 1px overlap, and the focused child raised so its ring isn't clipped.
export const InputGroup = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-stretch",
      "[&>*]:rounded-none",
      "[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md",
      "[&>*:not(:first-child)]:-ml-px",
      "[&>*:focus]:relative [&>*:focus]:z-10",
      "[&>*:focus-visible]:relative [&>*:focus-visible]:z-10",
      className,
    )}
    {...props}
  />
);
