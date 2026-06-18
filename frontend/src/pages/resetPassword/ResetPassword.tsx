import { CombinedGraphQLErrors } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";
import { useChangePassword } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import * as yup from "yup";

const schema = yup.object({
  resetKey: yup.string().required("Reset Key is required"),
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
type ResetPasswordFormData = yup.Asserts<typeof schema>;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword: FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const { isAuthenticated } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const [changePassword, { loading }] = useChangePassword();

  if (isAuthenticated) navigate(ROUTE_HOME);

  const key = query.get("key");

  if (!key) return <ErrorMessage error="Invalid request" />;

  const onSubmit = (formData: ResetPasswordFormData) => {
    const userData = {
      reset_key: formData.resetKey,
      new_password: formData.newPassword,
    };
    setSubmitError(undefined);
    changePassword({ variables: { userData } })
      .then(() => {
        navigate(`${ROUTE_LOGIN}?msg=password-reset`);
      })
      .catch(
        (error: unknown) =>
          CombinedGraphQLErrors.is(error) && setSubmitError(error.message),
      );
  };

  const errorList = [
    errors.resetKey?.message,
    errors.newPassword?.message,
    errors.confirmNewPassword?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Reset Password" />
      <form
        className="mx-auto w-full max-w-xl self-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" value={key} {...register("resetKey")} />

        <div className="mt-2">
          <h3>Reset Password</h3>
          <hr className="my-4 border-border" />
          <div className="mb-3">
            <Input
              type="password"
              placeholder="New Password"
              aria-invalid={!!errors.newPassword}
              {...register("newPassword")}
            />
            <div className="text-sm text-destructive">
              {errors?.newPassword?.message}
            </div>
          </div>
          <div className="mb-3">
            <Input
              type="password"
              placeholder="Confirm New Password"
              aria-invalid={!!errors.confirmNewPassword}
              {...register("confirmNewPassword")}
            />
            <div className="text-sm text-destructive">
              {errors?.confirmNewPassword?.message}
            </div>
          </div>
        </div>

        {errorList.map((error) => (
          <div key={error} className="text-right text-destructive">
            {error}
          </div>
        ))}

        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={loading}>
            Set Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
