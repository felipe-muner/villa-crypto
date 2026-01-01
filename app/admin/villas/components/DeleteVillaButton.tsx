"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteVillaButtonProps {
  villaId: string;
  villaName: string;
}

export function DeleteVillaButton({ villaId, villaName }: DeleteVillaButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/villas/${villaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete villa");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting villa:", error);
      alert("Failed to delete villa");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
        >
          {isDeleting ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
      title={`Delete ${villaName}`}
    >
      Delete
    </button>
  );
}
