"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useOrganizationStore } from "@/store/organization-store";
import ForgotPasswordModal from "./ForgotPasswordModal";
import styles from "./login-screen.module.css";

export default function LoginForm() {
  const router = useRouter();
  const hydrateWorkspace = useOrganizationStore(
    (state) => state.hydrateWorkspace,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to sign in. Please try again.");
      }

      if (
        (data?.redirectTo !== "/operations" &&
          data?.redirectTo !== "/restaurant") ||
        !data.workspace
      ) {
        throw new Error(
          "Sign-in did not return your workspace. Please try again.",
        );
      }

      hydrateWorkspace(data.workspace);
      router.replace(data.redirectTo);
    } catch (error) {
      console.error("Login failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} aria-busy={isLoading} className={styles.form}>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="email" className={styles.fieldLabel}>
            Work email
          </label>
          <div className={styles.inputGroup}>
            <Mail aria-hidden="true" className={styles.inputIcon} size={17} />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={isLoading}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label htmlFor="password" className={styles.fieldLabel}>
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
              className={styles.resetPassword}
            >
              Forgot password?
            </button>
          </div>
          <div className={styles.inputGroup}>
            <LockKeyhole
              aria-hidden="true"
              className={styles.inputIcon}
              size={17}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Enter your password"
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
              autoComplete="current-password"
              disabled={isLoading}
              className={styles.input}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
              disabled={isLoading}
              className={styles.revealPassword}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={17} />
              ) : (
                <Eye aria-hidden="true" size={17} />
              )}
            </button>
          </div>
        </div>

        <label className={styles.remember}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={isLoading}
          />
          Remember this device
        </label>

        <button type="submit" disabled={isLoading} className={styles.submit}>
          {isLoading ? (
            <>
              Signing in…
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="motion-safe:animate-spin"
              />
            </>
          ) : (
            <>
              Sign in
              <ArrowRight aria-hidden="true" size={18} />
            </>
          )}
        </button>
      </form>
      {showForgotPassword && (
        <ForgotPasswordModal
          defaultEmail={email}
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </>
  );
}
