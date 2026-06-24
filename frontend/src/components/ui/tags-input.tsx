import { type KeyboardEvent, useRef, useState } from "react";
import { cn } from "src/lib/utils";

interface TagsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  inputId?: string;
}

// Free-text multi-value input (replaces react-select/creatable). Type and press
// Enter to add a chip; Backspace on an empty input removes the last one.
// Case-insensitive duplicates are rejected (matching the old isValidNewOption).
export function TagsInput({
  values: initial,
  onChange,
  placeholder,
  inputId,
}: TagsInputProps) {
  const [values, setValues] = useState(initial);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const update = (next: string[]) => {
    setValues(next);
    onChange(next);
  };

  const add = () => {
    const value = text.trim();
    if (value && !values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      update([...values, value]);
    }
    setText("");
  };

  const removeAt = (index: number) =>
    update(values.filter((_, i) => i !== index));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && text === "" && values.length > 0) {
      removeAt(values.length - 1);
    }
  };

  return (
    <label className="flex min-h-9 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-input-bg px-2 py-1 text-input-foreground transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
      {values.map((value, index) => (
        <span
          key={value}
          className="inline-flex items-center gap-1 rounded bg-primary/20 py-0.5 pl-2 pr-1 text-sm"
        >
          {value}
          <button
            type="button"
            aria-label={`Remove ${value}`}
            className={cn(
              "flex size-4 items-center justify-center rounded-sm border-0 bg-transparent text-input-foreground/60",
              "hover:bg-black/10 hover:text-input-foreground",
            )}
            onClick={(e) => {
              e.stopPropagation();
              removeAt(index);
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={inputId}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={values.length === 0 ? placeholder : ""}
        className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-input-foreground/50"
      />
    </label>
  );
}
