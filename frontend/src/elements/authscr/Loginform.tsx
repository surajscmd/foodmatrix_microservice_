"use client";

import ForgotPasswordModal from "@/elements/authscr/ForgotPasswordModal";
import { getCurrentUser } from "@/lib/organization-api";
import { useOrganizationStore } from "@/store/organization-store";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginForm = () => {
  const router = useRouter();

  // Zustand actions
  const setCurrentUser = useOrganizationStore(
    (state) => state.setCurrentUser,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      // --------------------------------------------------
      // 1. Authenticate
      // --------------------------------------------------

      const response = await fetch("/api/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to sign in. Please try again.",
        );
      }

      if (
        typeof data?.redirectTo !== "string" ||
        !data.redirectTo
      ) {
        throw new Error(
          "Authentication succeeded, but no destination was provided.",
        );
      }

      // --------------------------------------------------
      // 2. Always load the authenticated user
      // --------------------------------------------------

      const currentUserData = await getCurrentUser();

      // Store /auth/me immediately
      setCurrentUser(currentUserData);
      // --------------------------------------------------
      // 3. Redirect after Zustand is populated
      // --------------------------------------------------

      router.replace(data.redirectTo);
    } catch (error) {
      console.error("Login failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Login Error */}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400"
        >
          {error}
        </div>
      )}

      {/* Email */}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400"
        >
          Operator Email
        </label>

        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

          <input
            id="email"
            type="email"
            value={email}
            placeholder="name@foodmatrix.com"
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required
            autoComplete="email"
            disabled={isLoading}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder-zinc-600 transition-all focus:border-emerald-500/50 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password */}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400"
          >
            Terminal Access Key
          </label>

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            disabled={isLoading}
            className="cursor-pointer text-[10px] text-emerald-400 transition-all hover:text-emerald-300 disabled:opacity-50"
          >
            Forgot Password?
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Enter password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
            autoComplete="current-password"
            disabled={isLoading}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-10 text-xs font-mono text-white placeholder-zinc-600 transition-all focus:border-emerald-500/50 focus:outline-none disabled:opacity-50"
          />

          <button
            type="button"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            onClick={() =>
              setShowPassword((current) => !current)
            }
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-all hover:text-zinc-300 disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me */}

      <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) =>
            setRememberMe(e.target.checked)
          }
          disabled={isLoading}
          className="accent-emerald-500"
        />

        <span>Remember this device</span>
      </label>

      {/* Submit */}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold uppercase tracking-wide text-zinc-950 shadow-[0_4px_20px_rgba(16,185,129,0.15)] transition-all hover:bg-emerald-400 active:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent"
            aria-label="Signing in"
          />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Forgot Password */}

      <ForgotPasswordModal
        open={showForgotPassword}
        defaultEmail={email}
        onClose={() => setShowForgotPassword(false)}
        onSend={async (email) => {
          console.log(
            "Password reset requested for:",
            email,
          );

          // Better Auth password reset will be integrated next.
          await new Promise((resolve) =>
            setTimeout(resolve, 1500),
          );
        }}
      />
    </form>
  );
};

export default LoginForm;