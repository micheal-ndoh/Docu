"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInFormData } from "@/lib/validations";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setError("");

    if (attempts >= 5) {
      setError("Too many failed attempts. Please wait a few minutes before trying again.");
      return;
    }

    try {
      console.log("Attempting sign in with:", { email: data.email, password: "***" });
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });
      console.log("Sign in result:", result);
      setAttempts(0); // Reset on success
      window.location.href = "/";
    } catch (error: any) {
      setAttempts(prev => prev + 1);
      console.log("Sign in error caught:", error);
      console.log("Error type:", typeof error);
      console.log("Error keys:", Object.keys(error));
      console.log("Error message:", error.message);
      console.log("Error status:", error.status);
      console.log("Error code:", error.code);

      // Check for specific error types from better-auth
      const errorMessage = (error.message || "").toLowerCase();
      const errorCode = error.status || error.code;

      console.log("Processing error:", { errorMessage, errorCode });

      let errorToShow = "";

      if (errorCode === 401) {
        if (errorMessage.includes("user not found")) {
          errorToShow = "No account found with this email address. Please sign up first.";
        } else if (errorMessage.includes("invalid password") || errorMessage.includes("invalid") || errorMessage.includes("wrong") || errorMessage.includes("incorrect")) {
          errorToShow = "Incorrect password. Please try again.";
        } else {
          errorToShow = "Sign in failed. Please check your credentials and try again.";
        }
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("too many") || errorMessage.includes("attempt")) {
        errorToShow = "Too many attempts. Please wait before trying again.";
      } else if (errorMessage.includes("email not verified")) {
        errorToShow = "Please verify your email address before signing in.";
      } else {
        errorToShow = error.message || "Sign in failed. Please try again.";
      }

      console.log("Setting error to:", errorToShow);
      setError(errorToShow);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In with Email"}
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