import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactNode } from "react";
import { cn } from "src/lib/utils";

interface SwitchProps {
  id?: string;
  disabled?: boolean;
  title?: string;
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Switch = ({
  id,
  disabled,
  title,
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  className,
}: SwitchProps) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: Base UI Switch control is nested inside
  <label
    title={title}
    className={cn(
      "inline-flex cursor-pointer items-center gap-2 text-sm",
      className,
    )}
  >
    <BaseSwitch.Root
      render={<button type="button" />}
      nativeButton
      id={id}
      disabled={disabled}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      className="relative flex h-5 w-9 shrink-0 items-center rounded-full bg-input transition-colors data-[checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <BaseSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[18px]" />
    </BaseSwitch.Root>
    {label && <span>{label}</span>}
  </label>
);
