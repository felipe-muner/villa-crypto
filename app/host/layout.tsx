import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HostSidebar } from "./components/HostSidebar";

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isHost) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <HostSidebar user={session.user} />
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
