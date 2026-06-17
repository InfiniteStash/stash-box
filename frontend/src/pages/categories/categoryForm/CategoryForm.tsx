import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { FieldError, FormGroup, Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Select } from "src/components/ui/select";
import { ROUTE_CATEGORIES, ROUTE_CATEGORY } from "src/constants/route";

import {
  type CategoryQuery,
  type TagCategoryCreateInput,
  TagGroupEnum,
} from "src/graphql";
import { createHref } from "src/utils";
import * as yup from "yup";

type Category = NonNullable<CategoryQuery["findTagCategory"]>;

const groups = Object.keys(TagGroupEnum);

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  group: yup.mixed().oneOf(groups).required("Group is required"),
});

type CategoryFormData = yup.Asserts<typeof schema>;

interface TagProps {
  id?: string;
  category?: Category;
  callback: (data: TagCategoryCreateInput) => void;
}

const TagForm: FC<TagProps> = ({ id, category, callback }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: CategoryFormData) => {
    const callbackData: TagCategoryCreateInput = {
      name: data.name,
      description: data.description ?? null,
      group: data.group as TagGroupEnum,
    };
    callback(callbackData);
  };

  return (
    <form className="TagForm w-full md:w-1/2" onSubmit={handleSubmit(onSubmit)}>
      <FormGroup>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Name"
          aria-invalid={!!errors.name}
          defaultValue={category?.name ?? ""}
          {...register("name")}
        />
        <FieldError>{errors?.name?.message}</FieldError>
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
        <Label htmlFor="group">Group</Label>
        <Select
          id="group"
          defaultValue={category?.group ?? TagGroupEnum.ACTION}
          {...register("group")}
        >
          {groups.map((g) => (
            <option value={g} key={g}>{`${g.charAt(0).toUpperCase()}${g
              .toLowerCase()
              .slice(1)}`}</option>
          ))}
        </Select>
      </FormGroup>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit">Save</Button>
        <Button type="reset" className="sm:ml-auto sm:mr-2">
          Reset
        </Button>
        <Link to={createHref(id ? ROUTE_CATEGORY : ROUTE_CATEGORIES, { id })}>
          <Button variant="danger" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
};

export default TagForm;
