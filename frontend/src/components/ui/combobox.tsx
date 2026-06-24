import { Combobox } from "@base-ui/react/combobox";
import pDebounce from "p-debounce";
import {
  type FocusEventHandler,
  type KeyboardEventHandler,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { extractIdFromUrl } from "src/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

const popupClasses =
  "max-h-72 w-[var(--anchor-width)] overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none";
const itemClasses =
  "flex cursor-pointer select-none flex-col rounded px-3 py-2 text-sm data-[highlighted]:bg-accent data-[selected]:bg-primary/25";
const inputClasses =
  "flex h-9 w-full rounded-md border border-input bg-input-bg px-3 py-1 text-sm text-input-foreground transition-colors placeholder:text-input-foreground/50 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

// Shared async option loader: debounced server-side search with stale-response
// dropping and URL-paste ID extraction. The debounced wrapper is kept stable
// (loadOptions via ref) so the timer survives re-renders.
function useAsyncOptions<T>(loadOptions: (term: string) => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const loadRef = useRef(loadOptions);
  useEffect(() => {
    loadRef.current = loadOptions;
  }, [loadOptions]);
  const debouncedLoad = useMemo(
    () => pDebounce((t: string) => loadRef.current(t), 200),
    [],
  );

  const runSearch = async (raw: string) => {
    const next = extractIdFromUrl(raw);
    setTerm(next);
    if (!next.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    try {
      const results = await debouncedLoad(next);
      if (id !== requestId.current) return;
      setItems(results);
    } catch {
      if (id === requestId.current) setItems([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const reset = () => {
    setItems([]);
    setTerm("");
    setLoading(false);
  };

  return { items, term, loading, runSearch, reset };
}

function EmptyState({
  loading,
  term,
  noOptionsMessage,
}: {
  loading: boolean;
  term: string;
  noOptionsMessage?: (term: string) => ReactNode;
}) {
  const message = loading
    ? "Searching…"
    : (noOptionsMessage?.(term) ?? (term ? "No results" : null));
  if (!message) return null;
  return (
    <Combobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
      {message}
    </Combobox.Empty>
  );
}

interface AsyncSelectProps<T extends ComboboxOption> {
  loadOptions: (term: string) => Promise<T[]>;
  onChange: (value: T | null) => void;
  defaultValue?: T | null;
  value?: T | null;
  placeholder?: string;
  inputId?: string;
  isClearable?: boolean;
  onBlur?: FocusEventHandler;
  renderOption?: (option: T) => ReactNode;
  noOptionsMessage?: (term: string) => ReactNode;
}

// Async single-select combobox (replaces react-select/async). The picked value
// is retained and shown in the input.
export function AsyncSelect<T extends ComboboxOption>({
  loadOptions,
  onChange,
  defaultValue,
  value,
  placeholder = "Search...",
  inputId,
  isClearable = false,
  onBlur,
  renderOption,
  noOptionsMessage,
}: AsyncSelectProps<T>) {
  const { items, term, loading, runSearch } = useAsyncOptions(loadOptions);
  const [open, setOpen] = useState(false);
  // Async search: nothing to show until the user has typed, so don't open an
  // empty popup on focus.
  const hasResults = loading || items.length > 0 || term.trim().length > 0;

  return (
    <Combobox.Root
      items={items}
      defaultValue={defaultValue}
      value={value}
      filter={null}
      open={open && hasResults}
      onOpenChange={setOpen}
      onValueChange={(v: T | null) => onChange(v)}
      onInputValueChange={runSearch}
      itemToStringLabel={(item: T) => item?.label ?? ""}
      isItemEqualToValue={(a: T, b: T) => a.value === b.value}
    >
      <div className="relative">
        <Combobox.Input
          id={inputId}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputClasses}
        />
        {isClearable && (
          <Combobox.Clear
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-input-foreground/60 hover:text-input-foreground"
          >
            ×
          </Combobox.Clear>
        )}
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className={popupClasses}>
            <EmptyState
              loading={loading}
              term={term}
              noOptionsMessage={noOptionsMessage}
            />
            <Combobox.List>
              {(item: T) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className={itemClasses}
                >
                  {renderOption ? renderOption(item) : item.label}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

interface SelectComboboxProps<T extends ComboboxOption> {
  options: T[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  isClearable?: boolean;
  inputId?: string;
  className?: string;
}

// Static single-select over a fixed, filterable option list (replaces a plain
// react-select with static options).
export function SelectCombobox<T extends ComboboxOption>({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  inputId,
  className,
}: SelectComboboxProps<T>) {
  const selected = options.find((o) => o.value === value) ?? null;
  // Control the input so typing isn't fought by Base UI re-deriving it from the
  // selected value's label. Re-sync when the external value changes.
  const [inputValue, setInputValue] = useState(selected?.label ?? "");
  useEffect(() => {
    setInputValue(selected?.label ?? "");
  }, [selected?.label]);

  return (
    <Combobox.Root
      items={options}
      value={selected}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onValueChange={(item: T | null) => {
        onChange(item?.value);
        setInputValue(item?.label ?? "");
      }}
      itemToStringLabel={(item: T) => item?.label ?? ""}
      isItemEqualToValue={(a: T, b: T) => a.value === b.value}
      filter={(item: T, query: string) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      }
    >
      <div className={`relative ${className ?? ""}`}>
        <Combobox.Input
          id={inputId}
          placeholder={placeholder}
          className={inputClasses}
        />
        {isClearable && (
          <Combobox.Clear
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-input-foreground/60 hover:text-input-foreground"
          >
            ×
          </Combobox.Clear>
        )}
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className={popupClasses}>
            <Combobox.List>
              {(item: T) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className={itemClasses}
                >
                  {item.label}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

interface MultiComboboxProps<T extends ComboboxOption> {
  options: T[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  inputId?: string;
}

// Static multi-select over a fixed option list (replaces react-select isMulti).
// Base UI handles the filterable dropdown; chips are rendered manually so
// removal is explicit and not tied to the under-documented Chip parts.
export function MultiCombobox<T extends ComboboxOption>({
  options,
  values,
  onChange,
  placeholder,
  inputId,
}: MultiComboboxProps<T>) {
  const selected = options.filter((o) => values.includes(o.value));

  return (
    <Combobox.Root
      multiple
      items={options}
      value={selected}
      onValueChange={(items: T[]) => onChange(items.map((i) => i.value))}
      itemToStringLabel={(item: T) => item.label}
      isItemEqualToValue={(a: T, b: T) => a.value === b.value}
      filter={(item: T, query: string) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      }
    >
      {/* biome-ignore lint/a11y/noLabelWithoutControl: wraps the Base UI Combobox.Input below */}
      <label className="flex min-h-9 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-input-bg px-2 py-1 text-input-foreground transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
        {selected.map((item) => (
          <span
            key={item.value}
            className="inline-flex items-center gap-1 rounded bg-primary/20 py-0.5 pl-2 pr-1 text-sm"
          >
            {item.label}
            <button
              type="button"
              aria-label={`Remove ${item.label}`}
              className="flex size-4 items-center justify-center rounded-sm border-0 bg-transparent text-input-foreground/60 hover:bg-black/10 hover:text-input-foreground"
              onClick={() => onChange(values.filter((v) => v !== item.value))}
            >
              ×
            </button>
          </span>
        ))}
        <Combobox.Input
          id={inputId}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-input-foreground/50"
        />
      </label>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className={popupClasses}>
            <Combobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
              No options
            </Combobox.Empty>
            <Combobox.List>
              {(item: T) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="flex cursor-pointer select-none items-center justify-between gap-2 rounded px-3 py-2 text-sm data-[highlighted]:bg-accent data-[selected]:bg-primary/25"
                >
                  {item.label}
                  <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

interface AsyncSearchAddProps<T extends ComboboxOption> {
  loadOptions: (term: string) => Promise<T[]>;
  onSelect: (option: T) => void;
  placeholder?: string;
  inputId?: string;
  autoFocus?: boolean;
  renderOption?: (option: T) => ReactNode;
  noOptionsMessage?: (term: string) => ReactNode;
  onInputChange?: (term: string) => void;
  onKeyDown?: KeyboardEventHandler;
}

// "Search and add" combobox: each pick fires onSelect and clears the field so
// the next item can be searched. The caller renders the chosen items elsewhere.
export function AsyncSearchAdd<T extends ComboboxOption>({
  loadOptions,
  onSelect,
  placeholder = "Search...",
  inputId,
  autoFocus,
  renderOption,
  noOptionsMessage,
  onInputChange,
  onKeyDown,
}: AsyncSearchAddProps<T>) {
  const { items, term, loading, runSearch, reset } =
    useAsyncOptions(loadOptions);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // Async search: nothing to show until the user has typed, so don't open an
  // empty popup on focus.
  const hasResults = loading || items.length > 0 || term.trim().length > 0;
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <Combobox.Root
      items={items}
      value={null}
      inputValue={term}
      filter={null}
      open={open && hasResults}
      onOpenChange={setOpen}
      onValueChange={(item: T | null) => {
        if (item) {
          onSelect(item);
          reset();
        }
      }}
      onInputValueChange={(value: string) => {
        runSearch(value);
        onInputChange?.(value);
      }}
      isItemEqualToValue={(a: T, b: T) => a.value === b.value}
    >
      <Combobox.Input
        ref={inputRef}
        id={inputId}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClasses}
      />
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className={popupClasses}>
            <EmptyState
              loading={loading}
              term={term}
              noOptionsMessage={noOptionsMessage}
            />
            <Combobox.List>
              {(item: T) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className={itemClasses}
                >
                  {renderOption ? renderOption(item) : item.label}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
