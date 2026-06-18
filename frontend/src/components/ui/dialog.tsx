import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "src/lib/utils";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export const DialogContent = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <BaseDialog.Portal>
    <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
    <BaseDialog.Popup
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xl outline-none",
        className,
      )}
    >
      {children}
    </BaseDialog.Popup>
  </BaseDialog.Portal>
);

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Title>) => (
  <BaseDialog.Title
    className={cn("mb-4 text-lg font-semibold", className)}
    {...props}
  />
);
