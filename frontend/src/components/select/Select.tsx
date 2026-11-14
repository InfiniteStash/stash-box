import { Combobox } from "@base-ui/react/combobox";
import { Select as BaseSelect } from "@base-ui/react/select";
import {
  type FocusEventHandler,
  type KeyboardEventHandler,
  type ReactNode,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import { extractIdFromUrl } from "src/utils";

export type MenuPlacement = "auto" | "top" | "bottom";
export type OnChangeValue<
  Option,
  Multiple extends boolean,
> = Multiple extends true ? readonly Option[] : Option | null;
export interface Option {
  label?: string;
  value?: unknown;
}
export interface OptionGroup<O> {
  label: string;
  options: O[];
}
type Options<O> = readonly (O | OptionGroup<O>)[];
const isGroup = <O,>(item: O | OptionGroup<O>): item is OptionGroup<O> =>
  typeof item === "object" && item !== null && "options" in item;

export interface SelectProps<O extends Option, M extends boolean = false> {
  options?: Options<O>;
  value?: OnChangeValue<O, M>;
  defaultValue?: OnChangeValue<O, M>;
  onChange?: (value: OnChangeValue<O, M>) => void;
  isMulti?: M;
  isClearable?: boolean;
  isSearchable?: boolean;
  isDisabled?: boolean;
  inputId?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  onBlur?: FocusEventHandler;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  menuPlacement?: MenuPlacement;
  formatOptionLabel?: (
    option: O,
    meta: { context: "menu" | "value" },
  ) => ReactNode;
  noOptionsMessage?: (state: { inputValue: string }) => ReactNode;
  loadOptions?: (input: string) => Promise<Options<O>>;
  controlShouldRenderValue?: boolean;
  closeMenuOnSelect?: boolean;
  hideSelectedOptions?: boolean;
  leading?: ReactNode;
  renderValue?: (values: readonly O[]) => ReactNode;
  createOption?: (input: string) => O | null;
  formatCreateLabel?: (input: string) => ReactNode;
  onCreateOption?: (input: string) => void;
  popupClassName?: string;
}

/** Shared Select and searchable Combobox, styled to match the surrounding forms. */
export default function Select<O extends Option, M extends boolean = false>(
  props: SelectProps<O, M>,
) {
  const {
    options = [],
    isMulti,
    isClearable,
    isDisabled,
    placeholder = "Select...",
    className = "",
    inputId,
    id,
    name,
    onBlur,
    formatOptionLabel,
    menuPlacement = "auto",
    loadOptions,
    createOption,
    leading,
  } = props;
  const [internalValue, setInternalValue] = useState<OnChangeValue<O, M>>(
    props.defaultValue ?? ((isMulti ? [] : null) as OnChangeValue<O, M>),
  );
  const selected = props.value !== undefined ? props.value : internalValue;
  const selectedItems: readonly O[] = Array.isArray(selected)
    ? selected
    : selected
      ? [selected as O]
      : [];
  const selectedLabel =
    !isMulti && props.controlShouldRenderValue !== false
      ? (selectedItems[0]?.label ?? "")
      : "";
  const [input, setInput] = useState(selectedLabel);
  useEffect(() => {
    setInput(selectedLabel);
  }, [selectedLabel]);
  const [remoteOptions, setRemoteOptions] = useState<Options<O>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const request = useRef(0);
  const loader = useRef(loadOptions);
  loader.current = loadOptions;
  const searchable =
    props.isSearchable ||
    !!loadOptions ||
    !!createOption ||
    (!!isMulti && !props.renderValue);
  useEffect(() => {
    if (!loader.current || !open) return;
    if (!input) {
      setRemoteOptions([]);
      setLoading(false);
      setError(false);
      return;
    }
    const current = ++request.current;
    let active = true;
    setLoading(true);
    setError(false);
    setRemoteOptions([]);
    Promise.resolve(loader.current(input))
      .then((result) => {
        if (active && current === request.current) setRemoteOptions(result);
      })
      .catch(() => {
        if (active && current === request.current) setError(true);
      })
      .finally(() => {
        if (active && current === request.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [input, open]);
  const source = loadOptions ? remoteOptions : options;
  const label = (option: O, context: "menu" | "value") =>
    formatOptionLabel?.(option, { context }) ?? option.label;
  const equal = (a: O, b: O) => a.value === b.value;
  const visible = (option: O) =>
    (!searchable ||
      loadOptions ||
      (option.label ?? "").toLowerCase().includes(input.toLowerCase())) &&
    !(
      isMulti &&
      props.hideSelectedOptions !== false &&
      selectedItems.some((s) => equal(option, s))
    );
  const groups = [
    {
      label: "",
      options: source
        .filter((item): item is O => !isGroup(item))
        .filter(visible),
    },
    ...source
      .filter(isGroup)
      .map((group) => ({ ...group, options: group.options.filter(visible) })),
  ].filter((group) => group.options.length);
  const newOption = input ? createOption?.(input) : null;
  const items = [
    ...groups.flatMap((g) => g.options),
    ...(newOption ? [newOption] : []),
  ];
  const change = (next: O | O[] | null) => {
    if (newOption && next && !Array.isArray(next) && equal(next, newOption))
      props.onCreateOption?.(input);
    setInternalValue(next as OnChangeValue<O, M>);
    props.onChange?.(next as OnChangeValue<O, M>);
    setInput(
      !isMulti &&
        props.controlShouldRenderValue !== false &&
        next &&
        !Array.isArray(next)
        ? (next.label ?? "")
        : "",
    );
    if (!isMulti || props.closeMenuOnSelect !== false) setOpen(false);
  };
  const valueContent = props.renderValue
    ? props.renderValue(selectedItems)
    : selectedItems.map((option) => label(option, "value"));
  const clear = isClearable && selectedItems.length > 0 && (
    <button
      type="button"
      className="base-select__clear"
      aria-label="Clear selection"
      disabled={isDisabled}
      onClick={() => change(isMulti ? [] : null)}
    >
      ×
    </button>
  );
  const side = menuPlacement === "top" ? "top" : "bottom";
  const empty = loading
    ? "Loading..."
    : error
      ? "Unable to load options. Try again."
      : props.noOptionsMessage
        ? props.noOptionsMessage({ inputValue: input })
        : "No options";
  const optionLabel = (option: O) =>
    newOption === option
      ? (props.formatCreateLabel?.(input) ?? `Add '${input}'`)
      : label(option, "menu");

  if (!searchable)
    return (
      <div className={`base-select ${className}`}>
        <BaseSelect.Root<O, boolean>
          multiple={isMulti}
          value={selected}
          onValueChange={change}
          items={source
            .flatMap((item) => (isGroup(item) ? item.options : [item]))
            .map((item) => ({ label: item.label, value: item }))}
          name={name}
          disabled={isDisabled}
          open={open}
          onOpenChange={setOpen}
          isItemEqualToValue={equal}
        >
          <div className="base-select__control">
            <BaseSelect.Trigger
              id={inputId ?? id}
              className="base-select__trigger"
              onBlur={onBlur}
              aria-label={inputId ? undefined : placeholder}
            >
              <BaseSelect.Value placeholder={placeholder}>
                {selectedItems.length ? valueContent : placeholder}
              </BaseSelect.Value>
              <BaseSelect.Icon className="base-select__icon">▾</BaseSelect.Icon>
            </BaseSelect.Trigger>
            {clear}
          </div>
          <BaseSelect.Portal>
            <BaseSelect.Positioner
              className="base-select__positioner"
              side={side}
              sideOffset={4}
              alignItemWithTrigger={false}
            >
              <BaseSelect.Popup
                className={`base-select__menu ${props.popupClassName ?? ""}`}
              >
                <BaseSelect.List className="base-select__menu-list">
                  {groups.map((group) => (
                    <BaseSelect.Group
                      key={group.label || group.options[0]?.label}
                    >
                      {group.label && (
                        <BaseSelect.GroupLabel className="base-select__group-label">
                          {group.label}
                        </BaseSelect.GroupLabel>
                      )}
                      {group.options.map((option) => (
                        <BaseSelect.Item
                          key={option.label}
                          value={option}
                          className="base-select__option"
                        >
                          <BaseSelect.ItemIndicator className="base-select__indicator">
                            ✓
                          </BaseSelect.ItemIndicator>
                          <BaseSelect.ItemText>
                            {label(option, "menu")}
                          </BaseSelect.ItemText>
                        </BaseSelect.Item>
                      ))}
                    </BaseSelect.Group>
                  ))}
                </BaseSelect.List>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        </BaseSelect.Root>
      </div>
    );

  return (
    <div className={`base-select ${className}`}>
      <Combobox.Root<O, boolean>
        multiple={isMulti}
        items={items}
        filter={null}
        value={props.controlShouldRenderValue === false ? null : selected}
        onValueChange={change}
        inputValue={input}
        onInputValueChange={(next, details) => {
          if (
            details.reason === "input-change" ||
            details.reason === "input-clear"
          )
            setInput(next);
        }}
        open={open}
        onOpenChange={setOpen}
        disabled={isDisabled}
        name={name}
        isItemEqualToValue={equal}
        autoHighlight
      >
        <Combobox.InputGroup className="base-select__control">
          {leading}
          {isMulti && (
            <Combobox.Chips
              className="base-select__chips"
              aria-label="Selected values"
            >
              {selectedItems.map((option) => (
                <Combobox.Chip
                  key={option.label}
                  className="base-select__multi-value"
                  aria-description="Press Backspace or Delete to remove"
                >
                  {label(option, "value")}
                  <Combobox.ChipRemove
                    className="base-select__multi-value__remove"
                    aria-label={`Remove ${option.label}`}
                  >
                    ×
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))}
            </Combobox.Chips>
          )}
          <Combobox.Input
            id={inputId ?? id}
            ref={props.inputRef}
            className="base-select__input"
            placeholder={placeholder}
            autoFocus={props.autoFocus}
            onBlur={(event) => {
              setInput(selectedLabel);
              onBlur?.(event);
            }}
            onKeyDown={props.onKeyDown}
            aria-label={inputId ? undefined : placeholder}
            aria-description={
              isMulti ? "Use arrow keys to navigate selected values" : undefined
            }
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text/plain");
              const extracted = extractIdFromUrl(pasted);
              if (extracted !== pasted) {
                event.preventDefault();
                setInput(extracted);
                setOpen(true);
              }
            }}
          />
          {clear}
          <Combobox.Trigger
            className="base-select__icon"
            aria-label="Open options"
          >
            ▾
          </Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner
            className="base-select__positioner"
            side={side}
            sideOffset={4}
          >
            <Combobox.Popup
              className={`base-select__menu ${props.popupClassName ?? ""}`}
            >
              {items.length === 0 && empty && (
                <div className="base-select__empty" role="status">
                  {empty}
                </div>
              )}
              <Combobox.List className="base-select__menu-list">
                {groups.map((group) => (
                  <Combobox.Group key={group.label || group.options[0]?.label}>
                    {group.label && (
                      <Combobox.GroupLabel className="base-select__group-label">
                        {group.label}
                      </Combobox.GroupLabel>
                    )}
                    {group.options.map((option) => (
                      <Combobox.Item
                        key={option.label}
                        value={option}
                        className="base-select__option"
                      >
                        {optionLabel(option)}
                      </Combobox.Item>
                    ))}
                  </Combobox.Group>
                ))}
                {newOption && (
                  <Combobox.Item
                    value={newOption}
                    className="base-select__option"
                  >
                    {optionLabel(newOption)}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
