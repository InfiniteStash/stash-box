import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";
import { cn } from "src/lib/utils";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  side?: Side;
  align?: Align;
  delay?: number;
  className?: string;
}

export const Tooltip = ({
  children,
  content,
  side = "bottom",
  align = "center",
  delay = 200,
  className,
}: TooltipProps) => {
  if (!content) return children;
  return (
    <BaseTooltip.Provider delay={delay}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger render={children} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} align={align} sideOffset={6}>
            <BaseTooltip.Popup
              className={cn(
                "z-50 max-w-xs whitespace-pre-wrap rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-lg",
                className,
              )}
            >
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
};
