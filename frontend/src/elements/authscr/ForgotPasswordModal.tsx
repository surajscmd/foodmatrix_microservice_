"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface ForgotPasswordModalProps {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
  onSend: (email: string) => Promise<void> | void;
}

export default function ForgotPasswordModal({
  open,
  defaultEmail = "",
  onClose,
  onSend,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    if (!email.trim()) return;

    setLoading(true);

    try {
      await onSend(email);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setEmail(defaultEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0d12] p-6 relative">

        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white">
          Forgot Password
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Enter your registered company email address.
        </p>

        {!success ? (
          <>
            <div className="mt-6">

              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                Company Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
              />

            </div>

            <button
              onClick={handleSend}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-400">
                Password reset link sent successfully.
              </p>

              <p className="mt-2 text-white font-mono text-sm">
                {email}
              </p>
            </div>

            <button
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