import type { CombinedGraphQLErrors } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { ROUTE_ACTIVATE, ROUTE_HOME, ROUTE_LOGIN } from "src/constants/route";
import { type ConfigQuery, useConfig, useNewUser } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import * as yup from "yup";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = yup.object({
  email: yup.string().email().required("Email is required"),
  inviteKey: yup
    .string()
    .trim()
    .nullable()
    .default(null)
    .when("$inviteRequired", ([inviteRequired], s) =>
      inviteRequired
        ? s
            .matches(UUID_REGEX, "Invalid invite key")
            .required("Invite key is required")
        : s.test(
            "uuid-if-present",
            "Invalid invite key",
            (v) => !v || UUID_REGEX.test(v),
          ),
    ),
});
type RegisterFormData = yup.Asserts<typeof schema>;

interface Props {
  config: ConfigQuery["getConfig"];
}

const Register: FC<Props> = ({ config }) => {
  const navigate = useNavigate();
  const [awaitingActivation, setAwaitingActivation] = useState(false);
  const { isAuthenticated } = useCurrentUser();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const inviteRequired = config.require_invite ?? true;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema, { context: { inviteRequired } }),
  });

  const [newUser] = useNewUser();

  if (isAuthenticated) navigate(ROUTE_HOME);

  const onSubmit = (formData: RegisterFormData) => {
    const userData = {
      email: formData.email,
      // Omit invite_key entirely when invites aren't required AND the user
      // didn't supply one — the server accepts a null/missing key in that
      // case. (Sending a placeholder like "-" used to fail the schema's
      // UUID format check.)
      ...(formData.inviteKey ? { invite_key: formData.inviteKey } : {}),
    };
    setSubmitError(undefined);
    newUser({ variables: { input: userData } })
      .then((response) => {
        if (response.data?.newUser) {
          navigate(
            `${ROUTE_ACTIVATE}?email=${encodeURIComponent(
              formData.email,
            )}&key=${response.data.newUser}`,
          );
        } else {
          setAwaitingActivation(true);
        }
      })
      .catch((err?: CombinedGraphQLErrors) => {
        if (err?.message) {
          setSubmitError(err.message);
        }
      });
  };

  if (awaitingActivation)
    return (
      <div className="LoginPrompt">
        <div className="mx-auto w-full max-w-xl self-center">
          <h5>Invite key accepted</h5>
          <p>Please check your email to complete your registration.</p>
          <a href={ROUTE_LOGIN} className="text-link hover:underline">
            Return to login
          </a>
        </div>
      </div>
    );

  const errorList = [
    errors.inviteKey?.message,
    errors.email?.message,
    submitError,
  ].filter((err): err is string => err !== undefined);

  return (
    <div className="LoginPrompt mx-auto flex">
      <Title page="Register Account" />
      <form
        className="mx-auto w-full max-w-xl self-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h3>Register account</h3>
        <hr className="my-4 border-border" />
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

        {inviteRequired && (
          <div className="mt-2 flex items-center gap-3">
            <Label htmlFor="inviteKey" className="w-1/3">
              Invite Key:
            </Label>
            <Input
              id="inviteKey"
              type="text"
              placeholder="Invite Key"
              aria-invalid={!!errors?.inviteKey}
              {...register("inviteKey")}
            />
          </div>
        )}

        {errorList.map((error) => (
          <div key={error} className="text-right text-destructive">
            {error}
          </div>
        ))}

        <div className="mt-2 flex justify-end">
          <Button type="submit">Register</Button>
        </div>
      </form>
    </div>
  );
};

const ConfigLoader = () => {
  const { data: config, loading } = useConfig();
  if (loading) return <LoadingIndicator message="Loading config..." />;

  if (!config)
    return <ErrorMessage error="Unable to load server configuration" />;

  return <Register config={config.getConfig} />;
};

export default ConfigLoader;
