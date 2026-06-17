import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import {
  ROUTE_SITE_CATEGORIES,
  ROUTE_SITE_CATEGORY,
} from "src/constants/route";

import type { SiteCategoryCreateInput, SiteCategoryQuery } from "src/graphql";
import { createHref } from "src/utils";
import * as yup from "yup";

type SiteCategory = NonNullable<SiteCategoryQuery["findSiteCategory"]>;

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  sort_order: yup
    .number()
    .integer("Sort order must be a whole number")
    .typeError("Sort order must be a number")
    .default(0),
});

type SiteCategoryFormData = yup.Asserts<typeof schema>;

interface SiteCategoryProps {
  id?: number;
  category?: SiteCategory;
  callback: (data: SiteCategoryCreateInput) => void;
}

const SiteCategoryForm: FC<SiteCategoryProps> = ({
  id,
  category,
  callback,
}) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: SiteCategoryFormData) => {
    const callbackData: SiteCategoryCreateInput = {
      name: data.name,
      description: data.description ?? null,
      sort_order: data.sort_order,
    };
    callback(callbackData);
  };

  return (
    <form
      className="SiteCategoryForm w-full md:w-1/2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormGroup>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          aria-invalid={!!errors.name}
          placeholder="Name"
          {...register("name")}
          defaultValue={category?.name ?? ""}
        />
        <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Description"
          defaultValue={category?.description ?? ""}
          {...register("description")}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="sort_order">Sort order</Label>
        <Input
          id="sort_order"
          type="number"
          aria-invalid={!!errors.sort_order}
          defaultValue={category?.sort_order ?? 0}
          {...register("sort_order")}
        />
        <FieldErrorMessage>{errors?.sort_order?.message}</FieldErrorMessage>
        <p className="text-sm text-muted-foreground">
          Categories are displayed in ascending sort order. Sites without a
          category are always shown last.
        </p>
      </FormGroup>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit">Save</Button>
        <Button type="reset" className="sm:ml-auto">
          Reset
        </Button>
        <Link
          to={createHref(id ? ROUTE_SITE_CATEGORY : ROUTE_SITE_CATEGORIES, {
            id,
          })}
        >
          <Button variant="danger" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
};

export default SiteCategoryForm;
