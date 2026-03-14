"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { COPY } from "@/lib/copy";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  HardHat,
  Crown,
  Loader2,
  Check,
  Copy,
  UserX,
  UserCheck,
} from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

function getRoleBadge(role: string) {
  switch (role) {
    case "owner":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          <Crown className="h-3 w-3 mr-1" aria-hidden="true" />
          {COPY.ROLE_OWNER}
        </Badge>
      );
    case "pm":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
          {COPY.ROLE_PM}
        </Badge>
      );
    case "crew_lead":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
          <HardHat className="h-3 w-3 mr-1" aria-hidden="true" />
          {COPY.ROLE_CREW_LEAD}
        </Badge>
      );
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export default function TeamClient() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"pm" | "crew_lead">("crew_lead");
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [copiedUrl, setCopiedUrl] = useState("");
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (json.data) {
        setMembers(json.data.members ?? []);
        setInvites(json.data.invites ?? []);
        setCurrentUserRole(json.data.currentUserRole ?? "");
      }
    } catch {
      console.error("Failed to fetch team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setSending(true);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();

      if (!res.ok) {
        setInviteError(json.error ?? COPY.ERROR_GENERIC);
        return;
      }

      setInviteSuccess(
        `${COPY.INVITE_SENT_TO} ${inviteEmail}. Invite link: ${json.data.inviteUrl}`
      );
      setInviteEmail("");
      setCopiedUrl(json.data.inviteUrl);
      fetchTeam();
    } catch {
      setInviteError(COPY.ERROR_GENERIC);
    } finally {
      setSending(false);
    }
  }

  async function handleCopyUrl() {
    if (copiedUrl) {
      await navigator.clipboard.writeText(copiedUrl);
    }
  }

  async function handleToggleActive(memberId: string, currentlyActive: boolean) {
    setUpdatingMember(memberId);
    try {
      if (currentlyActive) {
        await fetch(`/api/team/${memberId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/team/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        });
      }
      fetchTeam();
    } catch {
      console.error("Failed to update member");
    } finally {
      setUpdatingMember(null);
    }
  }

  async function handleChangeRole(memberId: string, newRole: "pm" | "crew_lead") {
    setUpdatingMember(memberId);
    try {
      await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchTeam();
    } catch {
      console.error("Failed to change role");
    } finally {
      setUpdatingMember(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite form — only for owners and PMs */}
      {(isOwner || currentUserRole === "pm") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              {COPY.INVITE_MEMBER}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="invite-email" className="sr-only">
                    {COPY.EMAIL_LABEL}
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="crew@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    aria-label={COPY.EMAIL_LABEL}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="invite-role" className="sr-only">
                    Role
                  </Label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "pm" | "crew_lead")
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Select role"
                  >
                    <option value="crew_lead">{COPY.ROLE_CREW_LEAD}</option>
                    <option value="pm">{COPY.ROLE_PM}</option>
                  </select>
                </div>
                <Button type="submit" disabled={sending} className="sm:w-auto">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {COPY.INVITE_SENDING}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                      {COPY.INVITE_SEND}
                    </>
                  )}
                </Button>
              </div>

              {inviteError && (
                <p className="text-sm text-red-600" role="alert">
                  {inviteError}
                </p>
              )}

              {inviteSuccess && (
                <div
                  className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3"
                  role="alert"
                >
                  <Check className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 break-all">{inviteSuccess}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUrl}
                    aria-label="Copy invite link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" aria-hidden="true" />
            {COPY.TEAM_TITLE}
            <Badge variant="outline" className="ml-2">
              {members.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {COPY.MEMBER_NO_MEMBERS}
            </p>
          ) : (
            <div className="divide-y">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        member.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {(member.full_name ?? "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          !member.is_active ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {member.full_name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-13 sm:ml-0">
                    {getRoleBadge(member.role)}
                    {!member.is_active && (
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-200"
                      >
                        {COPY.MEMBER_INACTIVE}
                      </Badge>
                    )}

                    {/* Actions — owner only, and can't edit self */}
                    {isOwner && member.role !== "owner" && (
                      <div className="flex items-center gap-1 ml-2">
                        {/* Toggle role */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingMember === member.id}
                          onClick={() =>
                            handleChangeRole(
                              member.id,
                              member.role === "pm" ? "crew_lead" : "pm"
                            )
                          }
                          aria-label={`Change ${member.full_name}'s role to ${
                            member.role === "pm" ? "Crew Lead" : "Project Manager"
                          }`}
                          title={`Switch to ${
                            member.role === "pm" ? "Crew Lead" : "Project Manager"
                          }`}
                        >
                          {updatingMember === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Toggle active */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingMember === member.id}
                          onClick={() =>
                            handleToggleActive(member.id, member.is_active)
                          }
                          aria-label={
                            member.is_active
                              ? `Deactivate ${member.full_name}`
                              : `Reactivate ${member.full_name}`
                          }
                          title={
                            member.is_active
                              ? COPY.MEMBER_DEACTIVATE
                              : COPY.MEMBER_REACTIVATE
                          }
                          className={
                            member.is_active
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          }
                        >
                          {member.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" aria-hidden="true" />
              {COPY.INVITE_PENDING}
              <Badge variant="outline" className="ml-2">
                {invites.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {COPY.INVITE_EXPIRES}{" "}
                        {new Date(invite.expires_at).toLocaleDateString("en-CA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-13 sm:ml-0">
                    {getRoleBadge(invite.role)}
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-200"
                    >
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission notice for non-owners */}
      {!isOwner && currentUserRole !== "pm" && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {COPY.MEMBER_ONLY_OWNER}
        </p>
      )}
    </div>
  );
}
