import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileBottomNav } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile with company info
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, company_id, companies(name)")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name ?? user.email ?? "User";

  // Supabase returns foreign key joins as arrays when using .select()
  const companies = profile?.companies as unknown as
    | { name: string }
    | null;
  const companyName = companies?.name ?? "";

  return (
    <div className="flex min-h-screen bg-[hsl(210,20%,98%)]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar userName={userName} companyName={companyName} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8 scrollbar-thin">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
