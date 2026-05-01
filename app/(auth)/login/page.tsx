"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--background)" }}>

      {/* background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--invicta-green) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">

        {/* logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--invicta-green)" }}>
              <span className="text-black font-bold text-sm">I</span>
            </div>
            <span className="text-2xl font-bold tracking-wide" style={{ fontFamily: "'Play', sans-serif" }}>
              INVICTA
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-bold tracking-widest"
              style={{ background: "var(--invicta-green)", color: "#000" }}>AI</span>
          </div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Unconquered.
          </p>
        </div>

        {/* card */}
        <div className="rounded-2xl border p-8"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>

          <h1 className="text-xl font-bold mb-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            {isSignUp ? "Start closing deals with Invicta." : "Sign in to your workspace."}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "var(--muted-foreground)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--invicta-green)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "var(--muted-foreground)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--invicta-green)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-50"
                >
                  {showPassword
                    ? <EyeOff size={16} />
                    : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "var(--invicta-red)15", color: "var(--invicta-red)", border: "1px solid var(--invicta-red)30" }}>
                {error}
              </div>
            )}

            {message && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "var(--invicta-green)15", color: "var(--invicta-green)", border: "1px solid var(--invicta-green)30" }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              style={{ background: "var(--invicta-green)", color: "#000" }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              className="font-bold transition-colors hover:opacity-80"
              style={{ color: "var(--invicta-green)" }}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
          Invicta.ai — Unconquered
        </p>
      </div>
    </div>
  );
}
