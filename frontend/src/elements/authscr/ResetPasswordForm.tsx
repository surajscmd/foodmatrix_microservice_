"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const inputClass =
  "mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus-visible:outline-emerald-400";

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || saving) return;
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setPassword("");
      setConfirmation("");
      window.history.replaceState(null, "", "/login/reset-password");
      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update your password.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {success ? (
        <p role="status" className="text-sm text-emerald-400">
          Password updated. Sign in with your new password.
        </p>
      ) : !token ? (
        <p role="alert" className="text-sm text-zinc-300">
          This link is invalid or expired. Return to sign in and request a new
          link.
        </p>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <label className="block text-xs font-medium text-zinc-300">
            New password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-zinc-300">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className={inputClass}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      <Link
        href="/login"
        className="inline-block text-sm text-emerald-400 hover:text-emerald-300"
      >
        Back to sign in
      </Link>
    </div>
  );
}
