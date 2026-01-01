import { VillaForm } from "../components/VillaForm";

export default function NewVillaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Villa
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new property listing
        </p>
      </div>

      <VillaForm />
    </div>
  );
}
