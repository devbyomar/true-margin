"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COPY } from "@/lib/copy";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefillEmail ?? "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    // Refresh server state first so the session cookie is picked up,
    // then navigate — avoids a double round-trip.
    router.refresh();
    router.push(inviteToken ? `/invite/${inviteToken}` : "/dashboard");
  }

  return (
    <Card className="border-0 shadow-2xl shadow-black/5 lg:border lg:shadow-lg animate-scale-in">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-center font-bold">
          Welcome back
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          {COPY.LOGIN_SUBTITLE}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div
              className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{COPY.EMAIL_LABEL}</Label>
            <Input
              id="email"
              type="email"
              placeholder="mike@northwindhvac.ca"
              autoComplete="email"
              aria-label={COPY.EMAIL_LABEL}
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{COPY.PASSWORD_LABEL}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-label={COPY.PASSWORD_LABEL}
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            aria-label={COPY.LOGIN_BUTTON}
          >
            {isLoading ? "Signing in…" : COPY.LOGIN_BUTTON}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          {COPY.NO_ACCOUNT}{" "}
          <Link
            href={
              inviteToken
                ? `/signup?invite=${inviteToken}${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ""}`
                : "/signup"
            }
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            {COPY.SIGNUP_BUTTON}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
