import type { FC } from "react";
import type { FieldError, UseFormRegister } from "react-hook-form";
import {
  FieldError as FieldErrorMessage,
  Label,
} from "src/components/ui/field";

import NoteInput from "./NoteInput";

interface Props {
  // biome-ignore lint/suspicious/noExplicitAny: Awkward react-hook-form type
  register: UseFormRegister<any>;
  error?: FieldError;
}

const EditNote: FC<Props> = ({ register, error }) => (
  <div className="mb-3">
    <Label>Edit Note</Label>
    <NoteInput register={register} hasError={!!error?.message} />
    <p className="mt-1 text-sm text-muted-foreground">
      Please add any relevant sources or other supporting information for your
      edit.
    </p>
    <FieldErrorMessage>{error?.message}</FieldErrorMessage>
  </div>
);

export default EditNote;
