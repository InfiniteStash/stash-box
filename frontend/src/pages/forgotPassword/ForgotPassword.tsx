import type { CombinedGraphQLErrors } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { ROUTE_HOME } from "src/constants/route";
import { useResetPassword } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import * as yup from "yup";

const schema = yup.object({
  email: yup.string().email().required("Email is required"),
});
type ResetPasswordFormData = yup.Asserts<typeof schema>;

const ForgotPassword: FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const [resetEmail, setResetEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [resetPassword, { loading }] = useResetPassword();

  if (isAuthenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      email: formData.email,
    };
    setSubmitError(undefined);
    resetPassword({ variables: { input: userData } })
      .then(() => {
        setResetEmail(formData.email);
      })
      .catch((err?: CombinedGraphQLErrors) => {
        if (err?.message) {
          setSubmitError(err.message);
        }
      });
  };

  if (resetEmail)
    return (
      <div className="LoginPrompt">
        <div className="mx-auto w-full max-w-xl self-center">
          <h5>Pasword reset</h5>
          <p>
            If a matching account was found an email was sent to {resetEmail} to
            allow you to reset your password.
          </p>
          <a href="/login" className="text-link hover:underline">
            Return to login
          </a>
        </div>
      </div>
    );

  const errorList = [errors.email?.message, submitError].filter(
    (err): err is string => err !== undefined,
  );

  return (
    <div className="LoginPrompt mx-auto flex">
      <Title page="Forgot Password" />
      <form
        className="mx-auto w-full max-w-xl self-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex items-center gap-3">
          <Label htmlFor="email" className="w-1/3">
            Email:
          </Label>
          <Input
            id="email"
            type="text"
            placeholder="Email"
            aria-invalid={!!errors?.email}
            {...register("email")}
          />
        </div>

        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={loading}>
            Reset Password
          </Button>
        </div>

        {errorList.map((error) => (
          <div key={error} className="text-right text-destructive">
            {error}
          </div>
        ))}
      </form>
    </div>
  );
};

export default ForgotPassword;
