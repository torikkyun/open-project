import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authEndpoints } from "../../api/endpoints";
import { setSessionTokens } from "../../api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await authEndpoints.login({ email, password });
      setSessionTokens(
        response.access_token,
        response.refresh_token,
        response.user.role,
      );
      await navigate({ to: "/dashboard" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-1 p-md">
      <form
        className="w-full max-w-[28rem] space-y-lg border border-hairline bg-canvas p-xl"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-eyebrow uppercase text-primary">Open Project</p>
          <h1 className="mt-xs text-headline">Sign in</h1>
        </div>
        <label className="block space-y-xxs text-body-sm">
          Email
          <input
            className="mt-xxs block w-full border border-hairline-strong p-sm"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block space-y-xxs text-body-sm">
          Password
          <input
            className="mt-xxs block w-full border border-hairline-strong p-sm"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? (
          <p className="text-body-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="w-full bg-primary px-md py-sm text-button text-on-primary disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
