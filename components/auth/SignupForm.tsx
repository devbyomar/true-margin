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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COPY, PROVINCE_OPTIONS } from "@/lib/copy";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().optional(),
  province: z.string().optional(),
});

// Full schema for owner signup (non-invite)
const ownerSignupSchema = signupSchema.extend({
  companyName: z.string().min(2, "Company name is required"),
  province: z.string().min(2, "Please select a province"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email");
  const isInviteFlow = !!inviteToken;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"account" | "company">("account");

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(isInviteFlow ? signupSchema : ownerSignupSchema),
    defaultValues: {
      province: "",
      email: prefillEmail ?? "",
    },
  });

  const provinceValue = watch("province");

  async function handleAccountStep() {
    const valid = await trigger(["fullName", "email", "password"]);
    if (valid) {
      if (isInviteFlow) {
        // Skip company step — submit directly
        handleSubmit(onSubmit)();
      } else {
        setStep("company");
      }
    }
  }

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Failed to create account. Please try again.");
      setIsLoading(false);
      return;
    }

    // If accepting an invite, skip company creation —
    // the invite accept endpoint will link the user to the company.
    if (isInviteFlow) {
      router.push(`/invite/${inviteToken}`);
      router.refresh();
      return;
    }

    // 2. Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: data.companyName,
        province: data.province,
      })
      .select("id")
      .single();

    if (companyError) {
      setError(companyError.message);
      setIsLoading(false);
      return;
    }

    // 3. Create user profile linked to company
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      company_id: company.id,
      full_name: data.fullName,
      role: "owner",
    });

    if (profileError) {
      setError(profileError.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="border-0 shadow-lg lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-center">
          {isInviteFlow ? "Create your account" : "Get started free"}
        </CardTitle>
        <CardDescription className="text-center">
          {isInviteFlow
            ? "Sign up to join your team on TrueMargin."
            : COPY.SIGNUP_SUBTITLE}
        </CardDescription>
        {/* Step indicator — only show for non-invite flow */}
        {!isInviteFlow && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <div
              className={`h-2 w-16 rounded-full transition-colors ${
                step === "account" ? "bg-primary" : "bg-muted"
              }`}
              aria-label="Step 1: Account details"
            />
            <div
              className={`h-2 w-16 rounded-full transition-colors ${
                step === "company" ? "bg-primary" : "bg-muted"
              }`}
              aria-label="Step 2: Company details"
            />
          </div>
        )}
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

          {step === "account" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">{COPY.FULL_NAME_LABEL}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Mike Thompson"
                  autoComplete="name"
                  aria-label={COPY.FULL_NAME_LABEL}
                  disabled={isLoading}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

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
                  autoComplete="new-password"
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
                type="button"
                className="w-full"
                onClick={handleAccountStep}
                aria-label="Continue to company setup"
              >
                Continue
              </Button>
            </>
          )}

          {step === "company" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">{COPY.COMPANY_NAME}</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Northwind HVAC Ltd."
                  aria-label={COPY.COMPANY_NAME}
                  disabled={isLoading}
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">{COPY.PROVINCE}</Label>
                <Select
                  value={provinceValue}
                  onValueChange={(value) => {
                    setValue("province", value, { shouldValidate: true });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="province" aria-label={COPY.PROVINCE}>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_OPTIONS.map((prov) => (
                      <SelectItem key={prov.value} value={prov.value}>
                        {prov.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.province.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("account")}
                  disabled={isLoading}
                  aria-label="Go back to account details"
                >
                  {COPY.BACK}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                  aria-label={COPY.SIGNUP_BUTTON}
                >
                  {isLoading ? "Creating account…" : COPY.SIGNUP_BUTTON}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          {COPY.HAS_ACCOUNT}{" "}
          <Link
            href={
              inviteToken
                ? `/login?invite=${inviteToken}${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ""}`
                : "/login"
            }
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            {COPY.LOGIN_BUTTON}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
