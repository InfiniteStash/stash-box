import type React from "react";
import { useId, useState } from "react";
import { EditorCard } from "src/components/fragments";
import { FieldError, FormGroup, Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { maxImageDate, partialDateError } from "src/utils";

import type { ImageCategorization } from "./types";

interface Props {
  value: ImageCategorization;
  onChange: (value: ImageCategorization) => void;
  readOnly?: boolean;
}

const CLASSNAME = "ImageCategorizationFields";

const ImageDate: React.FC<Props> = ({ value, onChange, readOnly = false }) => {
  const idPrefix = useId();
  const [dateFocused, setDateFocused] = useState(false);
  const dateError = dateFocused
    ? undefined
    : partialDateError(value.date, maxImageDate());

  if (readOnly && !value.date) {
    return null;
  }

  return (
    <EditorCard heading="Approximate date">
      {readOnly ? (
        <div className={`${CLASSNAME}-summary`}>
          {value.date && (
            <span className={`${CLASSNAME}-summary-item`}>{value.date}</span>
          )}
        </div>
      ) : (
        <FormGroup className={`${CLASSNAME}-date-group`}>
          <Label htmlFor={`${idPrefix}-date`} className="sr-only">
            Image date
          </Label>
          <Input
            id={`${idPrefix}-date`}
            type="text"
            aria-invalid={!!dateError}
            value={value.date ?? ""}
            placeholder="YYYY-MM-DD"
            onFocus={() => setDateFocused(true)}
            onBlur={() => setDateFocused(false)}
            onChange={(e) =>
              onChange({ ...value, date: e.currentTarget.value || null })
            }
          />
          <FieldError>{dateError}</FieldError>
          <p className="text-sm text-muted-foreground">
            Leave blank if uncertain.
          </p>
        </FormGroup>
      )}
    </EditorCard>
  );
};

export default ImageDate;
