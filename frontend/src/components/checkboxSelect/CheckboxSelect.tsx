import { Popover } from "@base-ui/react/popover";
import { uniq } from "lodash-es";
import type { FC } from "react";

interface IOptionType {
  label: string;
  value: string;
  subValues: string[] | null;
}

interface CheckboxSelectProps {
  values: IOptionType[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  plural?: string;
  selected?: string[];
}

// Collapsed multi-filter: a summary trigger opens a checkbox list. Selecting an
// option with subValues toggles the option plus all of its subValues.
const CheckboxSelect: FC<CheckboxSelectProps> = ({
  values,
  onChange,
  placeholder = "Select...",
  plural = "values",
  selected = [],
}) => {
  const isSelected = (option: IOptionType) => selected.includes(option.value);

  const toggle = (option: IOptionType) => {
    const group = [option.value, ...(option.subValues ?? [])];
    onChange(
      isSelected(option)
        ? selected.filter((s) => !group.includes(s))
        : uniq([...selected, ...group]),
    );
  };

  const summary =
    selected.length === 0
      ? placeholder
      : `${selected.length} ${plural} selected`;

  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-9 w-full items-center rounded-md border border-input bg-input-bg px-3 text-left text-sm text-input-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:border-ring">
        {summary}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className="z-50">
          <Popover.Popup className="max-h-72 w-[var(--anchor-width)] overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
            {values.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer select-none items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={isSelected(option)}
                  onChange={() => toggle(option)}
                  className="accent-primary"
                />
                {option.subValues === null ? (
                  option.label
                ) : (
                  <span className="text-muted-foreground">{option.label}</span>
                )}
              </label>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default CheckboxSelect;
