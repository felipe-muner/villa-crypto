import { db, villas } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { VillaForm } from "../../components/VillaForm";

interface EditVillaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVillaPage({ params }: EditVillaPageProps) {
  const { id } = await params;

  const [villa] = await db.select().from(villas).where(eq(villas.id, id)).limit(1);

  if (!villa) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Villa
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update {villa.name}
        </p>
      </div>

      <VillaForm villa={villa} />
    </div>
  );
}
