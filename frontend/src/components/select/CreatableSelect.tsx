import { useState } from "react";
import Select, { type OnChangeValue, type SelectProps } from "./Select";

interface StringOption {
  label: string;
  value: string;
}
interface CreatableProps<M extends boolean>
  extends Omit<SelectProps<StringOption, M>, "createOption"> {
  isValidNewOption?: (
    input: string,
    selected: readonly StringOption[],
  ) => boolean;
}
export default function CreatableSelect<M extends boolean = false>(
  props: CreatableProps<M>,
) {
  const [internalValue, setInternalValue] = useState<
    OnChangeValue<StringOption, M>
  >(
    props.defaultValue ??
      ((props.isMulti ? [] : null) as OnChangeValue<StringOption, M>),
  );
  const selected = props.value !== undefined ? props.value : internalValue;
  const values = Array.isArray(selected)
    ? selected
    : selected
      ? [selected as StringOption]
      : [];
  return (
    <Select
      {...props}
      value={selected}
      onChange={(next) => {
        setInternalValue(next);
        props.onChange?.(next);
      }}
      createOption={(input) => {
        const valid = props.isValidNewOption
          ? props.isValidNewOption(input, values)
          : !values.some((v) => v.value.toLowerCase() === input.toLowerCase());
        return input.trim() && valid ? { label: input, value: input } : null;
      }}
    />
  );
}
