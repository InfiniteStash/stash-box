import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import { cn } from "src/lib/utils";

interface TabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

export const Tabs = ({
  value,
  onValueChange,
  className,
  children,
}: TabsProps) => (
  <BaseTabs.Root
    value={value}
    onValueChange={(v) => onValueChange?.(String(v))}
    className={className}
  >
    {children}
  </BaseTabs.Root>
);

export const TabsList = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <BaseTabs.List
    className={cn(
      "flex flex-wrap items-end gap-1 border-b border-border",
      className,
    )}
  >
    {children}
  </BaseTabs.List>
);

export const TabsTrigger = ({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) => (
  <BaseTabs.Tab
    value={value}
    className={cn(
      "-mb-px cursor-pointer border-b-2 border-transparent px-4 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground data-[active]:border-link data-[active]:font-medium data-[active]:text-link",
      className,
    )}
  >
    {children}
  </BaseTabs.Tab>
);

export const TabsContent = ({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) => (
  <BaseTabs.Panel value={value} className={cn("py-4", className)}>
    {children}
  </BaseTabs.Panel>
);
