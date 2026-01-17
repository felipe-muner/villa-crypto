"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";

interface DeleteVillaButtonProps {
  villaId: string;
  villaName: string;
}

export function DeleteVillaButton({ villaId, villaName }: DeleteVillaButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const deleteVilla = trpc.villa.delete.useMutation({
    onSuccess: () => {
      showToast.deleted("Villa");
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteVilla.mutate({ id: villaId });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Villa</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{villaName}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteVilla.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteVilla.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteVilla.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
