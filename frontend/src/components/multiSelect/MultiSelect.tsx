import type { FC } from "react";
import { TagsInput } from "src/components/ui/tags-input";

interface MultiSelectProps {
  initialValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  inputId?: string;
}

const MultiSelect: FC<MultiSelectProps> = ({
  initialValues,
  onChange,
  placeholder = "Select...",
  inputId,
}) => (
  <TagsInput
    values={initialValues ?? []}
    onChange={onChange}
    placeholder={placeholder}
    inputId={inputId}
  />
);

export default MultiSelect;
