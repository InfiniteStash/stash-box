import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { MultiCombobox } from "src/components/ui/combobox";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { RoleEnum, type UserUpdateInput } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { userHref } from "src/utils";
import * as yup from "yup";

const schema = yup.object({
  name: yup.string().optional(),
  id: yup.string().required(),
  email: yup.string().email().required("Email is required"),
  roles: yup.array().of(yup.string().required()).required(),
});
type UserFormData = yup.Asserts<typeof schema>;

export type UserEditData = {
  name?: string;
  id: string;
  email: string;
  roles: RoleEnum[];
};

interface UserProps {
  user: UserUpdateInput;
  username: string;
  error?: string;
  callback: (data: UserEditData) => void;
}

const roles = Object.keys(RoleEnum).map((role) => ({
  label: role,
  value: role,
}));

const UserForm: FC<UserProps> = ({ user, username, callback, error }) => {
  const { isAdmin } = useCurrentUser();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      ...formData,
      id: formData.id,
      email: formData.email,
      roles: formData.roles as RoleEnum[],
    };
    callback(userData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full md:w-1/2">
      <input type="hidden" value={user.id} {...register("id")} />
      {isAdmin && (
        <FormGroup>
          <Label htmlFor="name">Username</Label>
          <Input
            id="name"
            aria-invalid={!!errors.name}
            type="text"
            placeholder="Username"
            defaultValue={user.name ?? ""}
            {...register("name")}
          />
          <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
        </FormGroup>
      )}
      <FormGroup>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          aria-invalid={!!errors.email}
          type="email"
          placeholder="Email"
          defaultValue={user.email ?? ""}
          {...register("email")}
        />
        <FieldErrorMessage>{errors?.email?.message}</FieldErrorMessage>
      </FormGroup>
      {isAdmin && (
        <FormGroup>
          <Label htmlFor="roles">Roles</Label>
          <Controller
            name="roles"
            control={control}
            defaultValue={(user.roles ?? []) as string[]}
            render={({ field: { onChange, value } }) => (
              <MultiCombobox
                inputId="roles"
                options={roles}
                values={value}
                onChange={onChange}
                placeholder="User roles"
              />
            )}
          />
        </FormGroup>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button type="submit">Save</Button>
        <Link to={userHref({ name: username })}>
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>
      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </form>
  );
};

export default UserForm;
