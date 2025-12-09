import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import type { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import TagSelect from "src/components/tagSelect";

import type { CreditRoleCreateInput, GetCreditRolesQuery } from "src/graphql";
import * as yup from "yup";

type CreditRole = NonNullable<GetCreditRolesQuery["getCreditRoles"]>[number];

type TagSlim = {
  id: string;
  name: string;
  description?: string | null;
  aliases: string[];
};

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().optional(),
  valid_tags: yup.array().optional(),
});

type CreditRoleFormData = yup.Asserts<typeof schema>;

interface CreditRoleFormProps {
  creditRole?: CreditRole;
  callback: (data: CreditRoleCreateInput, tags: TagSlim[]) => void;
}

const CreditRoleForm: FC<CreditRoleFormProps> = ({ creditRole, callback }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      valid_tags: creditRole?.valid_tags ?? [],
    },
  });

  const validTags = watch("valid_tags") ?? [];

  const onSubmit = (data: CreditRoleFormData) => {
    const callbackData: CreditRoleCreateInput = {
      name: data.name,
      description: data.description,
    };
    callback(callbackData, validTags as TagSlim[]);
  };

  return (
    <Form className="CreditRoleForm w-50" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          className={cx({ "is-invalid": errors.name })}
          placeholder="Name"
          defaultValue={creditRole?.name ?? ""}
          {...register("name")}
        />
        <Form.Control.Feedback type="invalid">
          {errors?.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Description"
          defaultValue={creditRole?.description ?? ""}
          {...register("description")}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Valid Tags</Form.Label>
        <TagSelect
          tags={validTags as TagSlim[]}
          onChange={(newTags: TagSlim[]) => setValue("valid_tags", newTags)}
          message="Add valid tags:"
        />
        <Form.Text>
          Optional tags that can be associated with this credit role.
        </Form.Text>
      </Form.Group>

      <Form.Group className="d-flex mb-3">
        <Button type="submit" className="col-2">
          Save
        </Button>
        <Button type="reset" className="ms-auto me-2">
          Reset
        </Button>
        <Button variant="danger" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Form.Group>
    </Form>
  );
};

export default CreditRoleForm;
