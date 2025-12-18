import { Component, createSignal, Show, JSX } from "solid-js";
import { usePB } from "../../config/pocketbase";
import { Button, Input } from "../../components";
import { useNavigate } from "@solidjs/router";

const AuthEmail: Component = () => {
  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [passwordConfirm, setPasswordConfirm] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [isCreatingAccount, setIsCreatingAccount] = createSignal(false);
  const { login, signUp } = usePB();
  const navigate = useNavigate();

  const handleSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent> = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email() || !password()) {
        throw new Error("Please fill in all fields");
      }

      if (isCreatingAccount() && password() !== passwordConfirm()) {
        throw new Error("Passwords don't match");
      }

      if (isCreatingAccount()) {
        await signUp(email(), username(), password(), passwordConfirm());
        navigate("/");
      } else {
        await login(email() ?? username(), password());
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsCreatingAccount(!isCreatingAccount());
    setError("");
    setPassword("");
    setPasswordConfirm("");
  };

  return (
    <>
      <h2 class="mb-5">{isCreatingAccount() ? "Create Account" : "Sign in"}</h2>

      <Show when={error()}>
        <div class="text-red-600">{error()}</div>
      </Show>

      <form onSubmit={handleSubmit} class="flex flex-col items-center w-full">
        <Show when={isCreatingAccount()}>
          <Input
            required
            name="username"
            label="Username"
            labelPosition="above"
            class="w-[95%] mb-2"
            value={username()}
            onChange={setUsername}
          />
        </Show>

        <Input
          required
          name="email"
          label={isCreatingAccount() ? "Email" : "Email or username"}
          labelPosition="above"
          class="w-[95%] mb-2"
          value={email()}
          onChange={setEmail}
          inputProps={{ type: isCreatingAccount() ? "email" : "text" }}
        />

        <Input
          required
          label="Password"
          name="password"
          labelPosition="above"
          class="w-[95%]"
          value={password()}
          onChange={setPassword}
          inputProps={{ type: "password" }}
        />

        <Show when={isCreatingAccount()}>
          <Input
            required
            label="Confirm password"
            name="password-confirm"
            labelPosition="above"
            class="w-[95%] mt-2"
            value={passwordConfirm()}
            onChange={setPasswordConfirm}
            inputProps={{ type: "password" }}
          />
        </Show>

        <Button type="submit" variantColor="good" class="w-[95%] mt-6 mb-2" disabled={isLoading()}>
          {isLoading()
            ? isCreatingAccount()
              ? "Creating account..."
              : "Logging in..."
            : isCreatingAccount()
            ? "Create Account"
            : "Login"}
        </Button>

        <Button class="w-[95%]" variant="text" type="button" onClick={toggleAuthMode}>
          {isCreatingAccount() ? "Already have an account? Login" : "Need to create an account?"}
        </Button>
      </form>
    </>
  );
};

export default AuthEmail;
