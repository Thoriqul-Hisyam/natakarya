"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="gradient-animated min-h-screen flex items-center justify-center p-4">
      {/* Floating orbs for visual flair */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-72 h-72 rounded-full opacity-20"
          style={{
            background: "var(--color-column-todo)",
            top: "10%",
            left: "10%",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: "var(--color-column-review)",
            top: "50%",
            right: "5%",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full opacity-15"
          style={{
            background: "var(--color-primary)",
            bottom: "10%",
            left: "30%",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Login Card */}
      <div className="glass rounded-3xl p-10 w-full max-w-md relative z-10 fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Natakarya
          </h1>
        </div>

        <p
          className="text-center mb-8 text-sm"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Plan, Track, and Deliver with your team
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-sm transition-smooth hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Google Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Footer text */}
        <p
          className="text-center mt-6 text-xs"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
