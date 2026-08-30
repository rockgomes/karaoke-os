"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";

const EMPTY: AuthState = { error: null, notice: null };

export default function LoginForm({
  next,
  allowSignUp = true,
}: {
  next: string;
  /** The operator door offers no sign-up: that account is granted, not claimed. */
  allowSignUp?: boolean;
}) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, formAction, pending] = useActionState(authenticate, EMPTY);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {/* The mode travels with the form. See the comment in actions.ts. */}
      <input type="hidden" name="mode" value={mode === "up" ? "signup" : "signin"} />
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
          minLength={mode === "up" ? 8 : undefined}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
        />
        {mode === "up" && (
          <p className="mt-1 text-xs text-ink-soft">At least 8 characters.</p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="text-sm text-ok">
          {state.notice}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink
                   hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
      </button>

      {allowSignUp && (
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="w-full text-sm text-ink-soft underline-offset-4 hover:underline"
      >
        {mode === "in"
          ? "No account yet? Create one"
          : "Already have an account? Sign in"}
      </button>
      )}
    </form>
  );
}
