import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "src/lib/utils";

// shadcn/ui Button Group, adapted for this codebase (cn from src/lib/utils,
// no Radix Slot). Joins adjacent controls (Button / Select / Input) into one
// connected widget: shared inner borders, flattened inner radii, focused child
// raised so its ring isn't clipped.
const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export interface ButtonGroupProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {}

export const ButtonGroup = ({
  className,
  orientation,
  ...props
}: ButtonGroupProps) => (
  <div
    role="group"
    data-orientation={orientation ?? "horizontal"}
    className={cn(buttonGroupVariants({ orientation }), className)}
    {...props}
  />
);

// Static text/label addon for a button group (e.g. "Add new link").
export const ButtonGroupText = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-md border border-input bg-muted px-4 text-sm font-medium",
      className,
    )}
    {...props}
  />
);

export { buttonGroupVariants };
