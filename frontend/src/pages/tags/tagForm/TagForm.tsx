import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { Controller, type FieldError, useForm } from "react-hook-form";
import { EditNote } from "src/components/form";
import { LoadingIndicator } from "src/components/fragments";
import MergeConflicts from "src/components/mergeConflicts";
import MultiSelect from "src/components/multiSelect";
import { Button } from "src/components/ui/button";
import { SelectCombobox } from "src/components/ui/combobox";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import {
  type TagFragment as Tag,
  type TagEditDetailsInput,
  useCategories,
} from "src/graphql";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
import type { TagMergeConflict } from "./merge";
import { type TagFormData, TagSchema } from "./schema";
import type { InitialTag } from "./types";

interface TagProps {
  tag?: Tag | null;
  callback: (data: TagEditDetailsInput, editNote: string) => void;
  initial?: InitialTag;
  conflicts?: TagMergeConflict[];
  saving: boolean;
}

const TagForm: FC<TagProps> = ({
  tag,
  callback,
  initial,
  conflicts,
  saving,
}) => {
  useBeforeUnload();
  const initialAliases = initial?.aliases ?? tag?.aliases ?? [];
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(TagSchema),
    defaultValues: {
      name: initial?.name ?? tag?.name ?? "",
      description: initial?.description ?? tag?.description ?? "",
      aliases: initialAliases,
      category: initial?.category ?? tag?.category,
    },
  });

  const fieldData = watch();

  const { loading: loadingCategories, data: categoryData } = useCategories();

  if (loadingCategories)
    return <LoadingIndicator message="Loading tag categories..." />;

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagEditDetailsInput = {
      name: data.name,
      description: data.description?.trim() || null,
      aliases: data.aliases ?? [],
      category_id: data.category?.id,
    };
    callback(callbackData, data.note);
  };

  const categories = (
    categoryData?.queryTagCategories.tag_categories ?? []
  ).map((cat) => ({
    label: cat.name,
    value: cat.id,
    group: cat.group,
  }));
  return (
    <form className="TagForm w-full md:w-1/2" onSubmit={handleSubmit(onSubmit)}>
      {conflicts && conflicts.length > 0 && (
        <MergeConflicts
          conflicts={conflicts}
          values={fieldData}
          onSelect={(field, value) =>
            // RHF cannot infer the value type from a dynamic field name.
            setValue(field, value as never, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      )}
      <FormGroup>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          aria-invalid={!!errors.name}
          placeholder="Name"
          {...register("name")}
        />
        <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Description"
          {...register("description")}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="tag-aliases-select">Aliases</Label>
        <Controller
          name="aliases"
          control={control}
          render={({ field: { onChange } }) => (
            <MultiSelect
              initialValues={initialAliases}
              onChange={onChange}
              placeholder="Enter name..."
              inputId="tag-aliases-select"
            />
          )}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="tag-category-select">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field: { onChange, value } }) => (
            <SelectCombobox
              inputId="tag-category-select"
              options={categories}
              isClearable
              placeholder="Category"
              value={value?.id}
              onChange={(v) => {
                const opt = categories.find((o) => o.value === v);
                onChange(opt ? { id: opt.value, name: opt.label } : null);
              }}
            />
          )}
        />
        <FieldErrorMessage>
          {(errors?.category as FieldError | undefined)?.message}
        </FieldErrorMessage>
      </FormGroup>

      <EditNote register={register} error={errors.note} />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled className="hidden" aria-hidden="true" />
        <Button type="submit" disabled={saving}>
          Submit Edit
        </Button>
        <Button type="reset" className="sm:ml-auto">
          Reset
        </Button>
        <Button variant="danger" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default TagForm;
