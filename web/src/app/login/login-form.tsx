"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";

const EMPTY: AuthState = { error: null, notice: null };

export default function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, formAction, pending] = useActionState(authenticate, EMPTY);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {/* The mode travels with the form. See the comment in actions.ts. */}
      <input type="hidden" name="mode" value={mode === "up" ? "signup" : "signin"} />

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
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2
                     outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                     dark:border-neutral-700 dark:bg-neutral-900"
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
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2
                     outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                     dark:border-neutral-700 dark:bg-neutral-900"
        />
        {mode === "up" && (
          <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          {state.notice}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white
                   hover:bg-blue-700 disabled:opacity-60
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-blue-600"
      >
        {pending ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="w-full text-sm text-neutral-500 underline-offset-4 hover:underline
                   focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        {mode === "in"
          ? "No account yet? Create one"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
