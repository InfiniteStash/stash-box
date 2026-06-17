import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { MultiCombobox } from "src/components/ui/combobox";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { RoleEnum, type UserUpdateInput } from "src/graphql";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string(),
  name: yup.string().required("Username is required"),
  email: yup.string().email().required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .test(
      "uniqueness",
      "Password must have at least 5 unique characters",
      (value) =>
        value !== undefined &&
        value
          .split("")
          .filter(
            (item: string, i: number, ar: string[]) => ar.indexOf(item) === i,
          )
          .join("").length >= 5,
    )
    .required("Password is required"),
  roles: yup.array().of(yup.string().required()).required(),
});

type UserFormData = yup.Asserts<typeof schema>;

export type UserData = {
  name: string;
  email: string;
  password: string;
  roles: RoleEnum[];
};

interface UserProps {
  user: UserUpdateInput;
  error?: string;
  callback: (data: UserData, id?: string) => void;
}

const roles = Object.keys(RoleEnum).map((role) => ({
  label: role,
  value: role,
}));

const UserForm: FC<UserProps> = ({ user, callback, error }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      ...formData,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      roles: formData.roles as RoleEnum[],
    };
    callback(userData, formData.id);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full md:w-1/2">
      <input type="hidden" value={user.id ?? ""} />
      <FormGroup>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          aria-invalid={!!errors.name}
          placeholder="Username"
          defaultValue={user.name ?? ""}
          {...register("name")}
        />
        <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
      </FormGroup>
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
      <FormGroup>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          aria-invalid={!!errors.password}
          type="password"
          placeholder="Password"
          defaultValue={user.password ?? ""}
          {...register("password")}
        />
        <FieldErrorMessage>{errors?.password?.message}</FieldErrorMessage>
      </FormGroup>
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
      <div className="mt-4 flex items-center gap-2">
        <Button type="submit">Create</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </form>
  );
};

export default UserForm;
