import { VillaForm } from "@/app/admin/villas/components/VillaForm";

export default function NewHostVillaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add New Villa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new property listing
        </p>
      </div>
      <VillaForm redirectPath="/host/villas" />
    </div>
  );
}
