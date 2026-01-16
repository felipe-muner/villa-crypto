import { auth } from "@/lib/auth";
import { db, villas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { VillaForm } from "@/app/admin/villas/components/VillaForm";

export default async function EditHostVillaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Get villa and verify ownership
  const [villa] = await db
    .select()
    .from(villas)
    .where(
      and(eq(villas.id, id), eq(villas.ownerEmail, session.user.email))
    )
    .limit(1);

  if (!villa) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Villa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your property listing
        </p>
      </div>
      <VillaForm villa={villa} redirectPath="/host/villas" />
    </div>
  );
}
