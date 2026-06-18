import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { FieldError, FormGroup, Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { ROUTE_FORGOT_PASSWORD, ROUTE_REGISTER } from "src/constants/route";
import { getCredentialsSetting, getPlatformURL } from "src/utils/createClient";
import * as yup from "yup";
import "./styles/legacy.css";
import { useCurrentUser } from "./hooks";

const schema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});
type LoginFormData = yup.InferType<typeof schema>;

const Messages: Record<string, string> = {
  "password-reset": "Password successfully reset",
  "account-created": "Account successfully created",
};

const Login: FC = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  const msg = new URLSearchParams(location.search).get("msg");
  const redirect = new URLSearchParams(location.search).get("redirect");
  const { isAuthenticated } = useCurrentUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  if (isAuthenticated) navigate("/");

  const onSubmit = async (formData: LoginFormData) => {
    setLoading(true);

    const body = new FormData();
    body.append("username", formData.username);
    body.append("password", formData.password);

    const res = await fetch(`${getPlatformURL()}login`, {
      method: "POST",
      body,
      credentials: getCredentialsSetting(),
    }).finally(() => setLoading(false));

    const returnURL = decodeURIComponent(redirect ?? "") || "/";
    if (res.ok) window.location.replace(returnURL);
    else setLoginError("Access denied");
  };

  return (
    <div className="LoginPrompt">
      <form
        className="mx-auto w-full max-w-sm self-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Username"
            aria-invalid={!!errors?.username}
            {...register("username")}
          />
          <FieldError>{errors?.username?.message}</FieldError>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            aria-invalid={!!errors?.password}
            {...register("password")}
          />
          <FieldError>{errors?.password?.message}</FieldError>
        </FormGroup>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Link
              to={ROUTE_REGISTER}
              className="text-link text-sm hover:underline"
            >
              Register
            </Link>
            <Link
              to={ROUTE_FORGOT_PASSWORD}
              className="text-link text-sm hover:underline"
            >
              Forgot Password
            </Link>
          </div>
          <Button type="submit" disabled={loading}>
            Login
          </Button>
        </div>
        {loginError && (
          <p className="mt-2 text-right text-destructive">{loginError}</p>
        )}
        {Messages[msg ?? ""] && (
          <p className="mt-2 text-right text-success">{Messages[msg ?? ""]}</p>
        )}
      </form>
    </div>
  );
};

export default Login;
