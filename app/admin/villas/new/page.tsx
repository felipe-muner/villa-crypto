import { VillaForm } from "../components/VillaForm";

export default function NewVillaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Villa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new property listing
        </p>
      </div>

      <VillaForm />
    </div>
  );
}
