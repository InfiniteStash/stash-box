import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactNode } from "react";
import { cn } from "src/lib/utils";

interface SwitchProps {
  id?: string;
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Switch = ({
  id,
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  className,
}: SwitchProps) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: Base UI Switch control is nested inside
  <label
    className={cn(
      "inline-flex cursor-pointer items-center gap-2 text-sm",
      className,
    )}
  >
    <BaseSwitch.Root
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      className="relative h-5 w-9 shrink-0 rounded-full bg-input transition-colors data-[checked]:bg-primary"
    >
      <BaseSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[18px]" />
    </BaseSwitch.Root>
    {label && <span>{label}</span>}
  </label>
);
