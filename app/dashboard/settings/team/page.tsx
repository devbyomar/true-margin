import TeamClient from "@/components/team/TeamClient";
import { COPY } from "@/lib/copy";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default function TeamPage() {
  return (
    <SettingsShell
      activeTab="team"
      title={COPY.TEAM_TITLE}
      description="Manage your team and invite new members."
    >
      <TeamClient />
    </SettingsShell>
  );
}
