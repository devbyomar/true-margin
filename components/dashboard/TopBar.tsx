"use client";

import { COPY } from "@/lib/copy";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  userName: string;
  companyName: string;
}

export function TopBar({ userName, companyName }: TopBarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-4 md:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-xs font-bold text-white">
          T
        </div>
        <span className="text-base font-bold text-foreground">{COPY.APP_NAME}</span>
      </div>

      {/* Breadcrumb / page context — desktop */}
      <div className="hidden items-center gap-3 md:flex">
        {companyName && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-xs font-bold text-emerald-600">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {companyName}
            </span>
          </div>
        )}
      </div>

      {/* Right side — user area */}
      <div className="flex items-center gap-3">
        {/* Notification bell placeholder */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User avatar + info */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium text-foreground leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Owner
            </span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label={COPY.NAV_LOGOUT}
          >
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden sm:inline">{COPY.NAV_LOGOUT}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
