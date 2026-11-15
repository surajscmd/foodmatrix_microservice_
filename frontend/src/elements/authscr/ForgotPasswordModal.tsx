"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

interface ForgotPasswordModalProps {
  defaultEmail?: string;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  defaultEmail = "",
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !email.trim()) return;
    setError("");

    setLoading(true);

    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to request a reset link.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0d12] p-6 relative"
      >
        <button
          type="button"
          aria-label="Close password reset"
          disabled={loading}
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="forgot-password-title" className="text-xl font-bold text-white">
          Forgot Password
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Enter your registered company email address.
        </p>

        {!success ? (
          <form onSubmit={handleSend}>
            <div className="mt-6">
              <label
                htmlFor="password-reset-email"
                className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono"
              >
                Company Email
              </label>

              <input
                id="password-reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p role="status" className="text-sm text-emerald-400">
                If an account exists for this email, check your inbox for a
                reset link.
              </p>

              <p className="mt-2 text-white font-mono text-sm">{email}</p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
