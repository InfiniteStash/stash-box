import type { CombinedGraphQLErrors } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";
import { useActivateUser } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import * as yup from "yup";

const schema = yup.object({
  name: yup.string().trim().required("Username is required"),
  activationKey: yup
    .string()
    .trim()
    .uuid("Invalid activation key")
    .required("Activation key is required"),
  password: yup.string().required("Password is required"),
});
type ActivateNewUserFormData = yup.InferType<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ActivateNewUserPage: FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateNewUserFormData>({
    resolver: yupResolver(schema),
  });

  const [activateNewUser] = useActivateUser();

  if (isAuthenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: ActivateNewUserFormData) => {
    const userData = {
      name: formData.name,
      activation_key: formData.activationKey,
      password: formData.password,
    };
    setSubmitError(undefined);
    activateNewUser({ variables: { input: userData } })
      .then(() => {
        navigate(`${ROUTE_LOGIN}?msg=account-created`);
      })
      .catch((err?: CombinedGraphQLErrors) => {
        if (err?.message) {
          setSubmitError(err.message);
        }
      });
  };

  const errorList = [
    errors.activationKey?.message,
    errors.name?.message,
    errors.password?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Active User" />
      <form
        className="mx-auto w-full max-w-xl self-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          type="hidden"
          value={query.get("key") ?? ""}
          {...register("activationKey")}
        />

        <h3>Register account</h3>
        <hr className="my-4 border-border" />
        <div className="flex items-center gap-3">
          <Label htmlFor="name" className="w-1/3">
            Username:
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Username"
            aria-invalid={!!errors?.name}
            {...register("name")}
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Label htmlFor="password" className="w-1/3">
            Password:
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            aria-invalid={!!errors?.password}
            {...register("password")}
          />
        </div>

        {errorList.map((error) => (
          <div key={error} className="text-right text-destructive">
            {error}
          </div>
        ))}

        <div className="mt-2 flex justify-end">
          <Button type="submit">Create Account</Button>
        </div>
      </form>
    </div>
  );
};

export default ActivateNewUserPage;
