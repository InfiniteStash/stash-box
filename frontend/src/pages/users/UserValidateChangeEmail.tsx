import { CombinedGraphQLErrors } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import type { User } from "src/context";
import { UserChangeEmailStatus, useValidateChangeEmail } from "src/graphql";
import { useQueryParams } from "src/hooks";
import * as yup from "yup";

const schema = yup.object({
  token: yup.string().required(),
  email: yup.string().required("Email is required"),
});
type ValidateChangeEmailFormData = yup.Asserts<typeof schema>;

const ValidateChangeEmail: FC<{ user: User }> = () => {
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [{ token, submitted }, setQueryParam] = useQueryParams({
    token: { name: "key", type: "string" },
    submitted: { name: "submitted", type: "boolean" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidateChangeEmailFormData>({
    resolver: yupResolver(schema),
  });

  const [validateChangeEmail, { loading }] = useValidateChangeEmail();

  if (submitted)
    return (
      <div className="LoginPrompt">
        <div className="mx-auto w-full max-w-xl self-center">
          <h5>Confirmation email sent</h5>
          <p>Please check your email to complete the email change.</p>
        </div>
      </div>
    );

  if (!token) return <ErrorMessage error="Missing token" />;

  const onSubmit = (formData: ValidateChangeEmailFormData) => {
    setSubmitError(undefined);
    validateChangeEmail({ variables: { ...formData } })
      .then((res) => {
        const status = res.data?.validateChangeEmail;
        if (status === UserChangeEmailStatus.CONFIRM_NEW)
          setQueryParam("submitted", true);
        else if (status === UserChangeEmailStatus.INVALID_TOKEN)
          setSubmitError(
            "Invalid or expired token, please restart the process.",
          );
        else if (status === UserChangeEmailStatus.EXPIRED)
          setSubmitError(
            "Email change token expired, please restart the process.",
          );
        else setSubmitError("An unknown error occurred");
      })
      .catch(
        (error: unknown) =>
          CombinedGraphQLErrors.is(error) && setSubmitError(error.message),
      );
  };

  const errorList = [
    errors.token?.message,
    errors.email?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt">
      <Title page="Confirm Email" />
      <form
        className="mx-auto w-full max-w-xl self-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h5>Change email</h5>
        <p>Enter a new email address to complete email change.</p>
        <input type="hidden" value={token} {...register("token")} />

        <div className="mt-2">
          <Input
            type="email"
            placeholder="New email"
            aria-invalid={!!errors?.email}
            {...register("email")}
          />
        </div>

        {errorList.map((error) => (
          <div key={error} className="text-right text-destructive">
            {error}
          </div>
        ))}

        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={loading}>
            Change Email
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ValidateChangeEmail;
