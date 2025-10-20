"use client";

import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpFormData } from "@/lib/validations";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch("password");

  const onSubmit = async (data: SignUpFormData) => {
    setError("");

    if (attempts >= 5) {
      setError("Too many failed attempts. Please wait a few minutes before trying again.");
      return;
    }

    try {
      await signUp.email({
        email: data.email,
        password: data.password,
        name: data.email.split("@")[0], // Use email prefix as default name
      });

      setAttempts(0); // Reset on success
      // Automatically sign in after successful signup
      await signIn.email({
        email: data.email,
        password: data.password,
      });

      router.push("/");
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      console.log("Sign up error:", err); // Debug log

      const errorMessage = err.message?.toLowerCase() || "";
      const errorCode = err.status || err.code;

      if (errorCode === 422 || errorMessage.includes("already exists") || errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
        setError("An account with this email already exists. Please sign in instead.");
        // Optionally, automatically sign in the user if they are already registered
        try {
          await signIn.email({
            email: data.email,
            password: data.password,
          });
          router.push("/");
        } catch (signInErr: any) {
          // If sign in fails, keep the error message
        }
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("too many") || errorMessage.includes("attempt")) {
        setError("Too many attempts. Please wait before trying again.");
      } else if (errorMessage.includes("password") && errorMessage.includes("weak")) {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (errorMessage.includes("email") && errorMessage.includes("invalid")) {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Failed to sign up.");
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
          Sign Up
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
            {isSubmitting ? "Signing Up..." : "Sign Up with Email"}
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
            Sign Up with Google
          </Button>
        </div>
      </div>
    </div>
  );
}