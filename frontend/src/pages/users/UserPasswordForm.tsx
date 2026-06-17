import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string(),
  existingPassword: yup.string().required("Existing password is required"),
  newPassword: yup
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
  confirmNewPassword: yup
    .string()
    .nullable()
    .oneOf([yup.ref("newPassword"), null], "Passwords don't match")
    .required("Password is required"),
});
type UserFormData = yup.InferType<typeof schema>;

export type UserPasswordData = {
  newPassword: string;
  existingPassword: string;
};

interface UserProps {
  error?: string;
  callback: (data: UserPasswordData) => void;
}

const UserForm: FC<UserProps> = ({ callback, error }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      existingPassword: formData.existingPassword,
      newPassword: formData.newPassword,
    };
    callback(userData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full md:w-1/2">
      <FormGroup>
        <Input
          aria-invalid={!!errors.existingPassword}
          type="password"
          placeholder="Existing Password"
          {...register("existingPassword")}
        />
        <FieldErrorMessage>
          {errors?.existingPassword?.message}
        </FieldErrorMessage>
      </FormGroup>
      <FormGroup>
        <Input
          aria-invalid={!!errors.newPassword}
          type="password"
          placeholder="New Password"
          {...register("newPassword")}
        />
        <FieldErrorMessage>{errors?.newPassword?.message}</FieldErrorMessage>
      </FormGroup>
      <FormGroup>
        <Input
          aria-invalid={!!errors.confirmNewPassword}
          type="password"
          placeholder="Confirm New Password"
          {...register("confirmNewPassword")}
        />
        <FieldErrorMessage>
          {errors?.confirmNewPassword?.message}
        </FieldErrorMessage>
      </FormGroup>
      <div className="flex items-center gap-2">
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </form>
  );
};

export default UserForm;
