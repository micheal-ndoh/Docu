"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInFormData } from "@/lib/validations";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: SignInFormData) => {
    setError("");

    if (attempts >= 5) {
      setError("Too many failed attempts. Please wait a few minutes before trying again.");
      return;
    }

    try {
      await signIn.email({
        email: data.email,
        password: data.password,
      });
      
      // If signIn is successful, redirect to submissions page
      router.push('/submissions');
    } catch (error: any) {
      setAttempts(prev => prev + 1);
      const errorMessage = (error.message || "").toLowerCase();
      const errorCode = error.status || error.code;

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl flex bg-white">
        {/* Left Side - Purple Gradient with Logo */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f0520] via-[#1e0836] to-[#3b0764] items-center justify-center p-12 relative overflow-hidden rounded-l-3xl">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          {/* Logo */}
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center mb-8">
              <svg className="h-24 w-24 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3L21 7L9 19L5 20L6 16L17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M15 5L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 21C3 21 5 19 7 19C9 19 9 21 11 21C13 21 13 19 15 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">DocuSeal</h1>
            <p className="text-xl text-purple-200">Welcome Back!</p>
          </div>

          {/* Zigzag Divider */}
          <svg className="absolute right-0 top-0 h-full w-8" viewBox="0 0 32 800" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L16 20 L0 40 L16 60 L0 80 L16 100 L0 120 L16 140 L0 160 L16 180 L0 200 L16 220 L0 240 L16 260 L0 280 L16 300 L0 320 L16 340 L0 360 L16 380 L0 400 L16 420 L0 440 L16 460 L0 480 L16 500 L0 520 L16 540 L0 560 L16 580 L0 600 L16 620 L0 640 L16 660 L0 680 L16 700 L0 720 L16 740 L0 760 L16 780 L0 800 L32 800 L32 0 Z" fill="white" />
          </svg>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 rounded-r-3xl">
          <div className="w-full max-w-md">
            {/* Back Button */}
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-purple-700 mb-8 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-purple-700 hover:text-purple-800 font-semibold">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  {...register("email")}
                  className="mt-1.5 h-12 border-gray-300 focus:border-purple-700 focus:ring-purple-700"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm text-purple-700 hover:text-purple-800 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...register("password")}
                    className="h-12 pr-12 border-gray-300 focus:border-purple-700 focus:ring-purple-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#3b0764] hover:bg-[#1e0836] text-white font-semibold text-base rounded-lg transition-colors"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <hr className="w-full border-0 h-[2px] bg-gray-300 rounded-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full h-12 border-2 border-gray-300 hover:border-purple-300 hover:bg-purple-50 font-semibold text-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}