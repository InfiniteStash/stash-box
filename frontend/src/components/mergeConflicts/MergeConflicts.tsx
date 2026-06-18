import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "src/components/fragments";
import { Alert } from "src/components/ui/alert";
import { Button } from "src/components/ui/button";

export interface MergeConflictOption {
  // Stable identity, used to match the current form value and as a React key.
  key: string;
  // Value applied to the form field when the option is selected.
  value: unknown;
  display: string;
  // Names of the performers/tags that hold this value.
  sources: string[];
}

export interface MergeConflict<TField extends string = string> {
  // Matching react-hook-form field name, used to read/set the value.
  field: TField;
  label: string;
  // Derives the identity key from the field's current value, to highlight the
  // active option.
  currentKey: (value: unknown) => string;
  options: MergeConflictOption[];
}

interface Props<TField extends string> {
  conflicts: MergeConflict<TField>[];
  // Current form values, used to highlight the active selection.
  values: Record<string, unknown>;
  onSelect: (field: TField, value: unknown) => void;
}

const MergeConflicts = <TField extends string>({
  conflicts,
  values,
  onSelect,
}: Props<TField>) => {
  if (conflicts.length === 0) return null;

  return (
    <Alert variant="warning" className="MergeConflicts">
      <h6>
        <Icon icon={faExclamationTriangle} className="mr-1" />
        Conflicting fields
      </h6>
      <p className="mb-2 text-sm">
        These fields differ between the merged entities. The first value is
        prefilled — select another to override it.
      </p>
      {conflicts.map((conflict) => {
        const activeKey = conflict.currentKey(values[conflict.field]);
        return (
          <div key={conflict.field} className="mb-1 flex items-center">
            <strong className="mr-2 min-w-32">{conflict.label}</strong>
            <div className="flex gap-2">
              {conflict.options.map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={option.key === activeKey ? "primary" : "secondary"}
                  onClick={() => onSelect(conflict.field, option.value)}
                  title={option.sources.join(", ")}
                >
                  {option.display}
                </Button>
              ))}
            </div>
          </div>
        );
      })}
    </Alert>
  );
};

export default MergeConflicts;
