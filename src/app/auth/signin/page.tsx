"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Try the helper first (better-auth client). Some environments or
      // library versions behave differently; fall back to a direct POST
      // to the auth endpoint if the helper throws or the response is
      // not successful.
      await signIn.email({ email, password });
      window.location.href = "/";
    } catch (error: any) {
      // Helper failed — try raw fetch to mirror curl behavior
      try {
        const res = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          // ensure cookies are handled for same-origin
          credentials: "same-origin",
        });

        if (res.ok) {
          // server should set session cookie; navigate to home
          window.location.href = "/";
          return;
        }

        const body = await res.json().catch(() => null);
        const msg = body?.message || body?.error || "Invalid credentials";
        setError(msg);
      } catch (fetchErr: any) {
        setError(fetchErr?.message || "Invalid credentials");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn.social({
        provider: "google",
      });
    } catch (error: any) {
      setError(error.message || "Google sign-in failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Sign In
        </h2>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In with Email
          </Button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
