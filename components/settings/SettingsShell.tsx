"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import {
  Building2,
  Users,
  CreditCard,
  ChevronRight,
  Settings,
} from "lucide-react";

const settingsTabs = [
  {
    key: "company",
    label: COPY.SETTINGS_TITLE,
    href: "/dashboard/settings",
    icon: Building2,
    description: "Company info & job defaults",
  },
  {
    key: "team",
    label: COPY.TEAM_TITLE,
    href: "/dashboard/settings/team",
    icon: Users,
    description: "Invite & manage your crew",
  },
  {
    key: "billing",
    label: COPY.BILLING_TITLE,
    href: "/dashboard/settings/billing",
    icon: CreditCard,
    description: "Plans, invoices & payments",
  },
] as const;

interface SettingsShellProps {
  children: React.ReactNode;
  activeTab: "company" | "team" | "billing";
  title: string;
  description: string;
}

export function SettingsShell({
  children,
  activeTab,
  title,
  description,
}: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{COPY.NAV_SETTINGS}</h1>
          <p className="text-sm text-muted-foreground">
            Configure your workspace, team, and billing.
          </p>
        </div>
      </div>

      {/* Layout: sidebar tabs + content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Left sidebar nav ─── */}
        <nav className="lg:w-[240px] shrink-0" aria-label="Settings navigation">
          {/* Desktop: vertical list */}
          <div className="hidden lg:block rounded-xl border bg-white shadow-sm overflow-hidden">
            {settingsTabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3.5 text-sm transition-all relative",
                    "border-b last:border-b-0",
                    isActive
                      ? "bg-primary/[0.04] text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <tab.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", isActive && "text-foreground")}>
                      {tab.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                      {tab.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-all",
                      isActive
                        ? "text-primary opacity-100"
                        : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"
                    )}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>

          {/* Mobile: horizontal pill tabs */}
          <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {settingsTabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ─── Right content area ─── */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>

          {/* Content */}
          <div className="animate-slide-up" style={{ animationDelay: "50ms" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
