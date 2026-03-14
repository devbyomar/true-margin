"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { COPY } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  HardHat,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

interface InviteInfo {
  id: string;
  email: string;
  role: string;
  companyName: string;
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUserEmail(user?.email ?? null);
    }
    checkAuth();
  }, []);

  // Fetch invite info
  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/team/invite/${token}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? COPY.INVITE_INVALID);
          return;
        }

        setInvite(json.data);
      } catch {
        setError(COPY.ERROR_GENERIC);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchInvite();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError("");

    try {
      const res = await fetch(`/api/team/invite/${token}`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? COPY.ERROR_GENERIC);
        return;
      }

      setAccepted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError(COPY.ERROR_GENERIC);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {COPY.INVITE_INVALID}
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push("/login")}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {COPY.INVITE_ACCEPTED}
            </h2>
            <Loader2 className="h-5 w-5 animate-spin mx-auto mt-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {COPY.INVITE_ACCEPT_TITLE}
          </CardTitle>
          {invite && (
            <p className="text-lg font-semibold text-primary mt-1">
              {invite.companyName}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {invite && (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Invited as
                  </span>
                  <Badge
                    className={
                      invite.role === "pm"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-green-100 text-green-800 border-green-200"
                    }
                  >
                    {invite.role === "pm" ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <HardHat className="h-3 w-3 mr-1" />
                    )}
                    {invite.role === "pm"
                      ? COPY.ROLE_PM
                      : COPY.ROLE_CREW_LEAD}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Email
                  </span>
                  <span className="text-sm font-medium">{invite.email}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              )}

              {isLoggedIn ? (
                <>
                  {userEmail?.toLowerCase() !== invite.email.toLowerCase() ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-amber-600">
                        You&apos;re signed in as{" "}
                        <strong>{userEmail}</strong>, but this invite was sent
                        to <strong>{invite.email}</strong>.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {COPY.INVITE_EMAIL_MISMATCH}
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="w-full"
                      size="lg"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {COPY.INVITE_ACCEPTING}
                        </>
                      ) : (
                        COPY.INVITE_ACCEPT_BUTTON
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {COPY.INVITE_ACCEPT_SUBTITLE}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() =>
                        router.push(
                          `/signup?invite=${token}&email=${encodeURIComponent(invite.email)}`
                        )
                      }
                      className="w-full"
                      size="lg"
                    >
                      Create Account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/login?invite=${token}&email=${encodeURIComponent(invite.email)}`
                        )
                      }
                      className="w-full"
                      size="lg"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
