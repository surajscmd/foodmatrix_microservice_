"use client";

import ForgotPasswordModal from "@/elements/authscr/ForgotPasswordModal";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";

import { useState } from "react";

const LoginForm = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => {
    console.log({
      email,
      password,
      rememberMe,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    handleLogin(email, password, rememberMe);

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}

      <div className="space-y-1.5">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
          Operator Email
        </label>

        <div className="relative">
          <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="email"
            value={email}
            placeholder="name@foodmatrix.com"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* Password */}

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Terminal Access Key
          </label>

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <div className="relative">
          <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-all"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Remember */}

      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="accent-emerald-500"
        />
        Remember this device
      </label>

      {/* Submit */}

      <button
        type="submit"
        disabled={isLoading}
           className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.15)] disabled:opacity-50 mt-2 uppercase tracking-wide"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      <ForgotPasswordModal
        open={showForgotPassword}
        defaultEmail={email}
        onClose={() => setShowForgotPassword(false)}
        onSend={async (email) => {
          console.log(email);

          // await authApi.forgotPassword(email);

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }}
      />
    </form>
  );
};

export default LoginForm;
