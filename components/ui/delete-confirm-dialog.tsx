"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { showToast } from "@/lib/toast";

interface DeleteConfirmDialogProps {
  /** The item name to display in the confirmation message */
  itemName: string;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Async function to execute on confirm */
  onConfirm: () => Promise<void>;
  /** Callback after successful deletion */
  onSuccess?: () => void;
  /** Trigger element - defaults to a delete button with trash icon */
  trigger?: React.ReactNode;
  /** Whether the trigger button should be disabled */
  disabled?: boolean;
  /** Variant for the default trigger button */
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Size for the default trigger button */
  triggerSize?: "default" | "sm" | "lg" | "icon";
}

export function DeleteConfirmDialog({
  itemName,
  title = "Are you sure?",
  description,
  onConfirm,
  onSuccess,
  trigger,
  disabled = false,
  triggerVariant = "destructive",
  triggerSize = "sm",
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultDescription =
    description ||
    `This will permanently delete this ${itemName.toLowerCase()}. This action cannot be undone.`;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      showToast.deleted(itemName);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      showToast.error(error, `Failed to delete ${itemName.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultTrigger = (
    <Button variant={triggerVariant} size={triggerSize} disabled={disabled}>
      <Trash2 className="h-4 w-4 mr-1" />
      Delete
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger || defaultTrigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{defaultDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

// Hook for programmatic delete confirmation
interface UseDeleteConfirmOptions {
  itemName: string;
  onConfirm: () => Promise<void>;
  onSuccess?: () => void;
}

export function useDeleteConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    isDeleting: boolean;
    options: UseDeleteConfirmOptions | null;
  }>({
    open: false,
    isDeleting: false,
    options: null,
  });

  const confirmDelete = (options: UseDeleteConfirmOptions) => {
    setState({ open: true, isDeleting: false, options });
  };

  const handleConfirm = async () => {
    if (!state.options) return;

    setState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await state.options.onConfirm();
      showToast.deleted(state.options.itemName);
      state.options.onSuccess?.();
      setState({ open: false, isDeleting: false, options: null });
    } catch (error) {
      showToast.error(error, `Failed to delete ${state.options.itemName.toLowerCase()}`);
      setState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCancel = () => {
    setState({ open: false, isDeleting: false, options: null });
  };

  const DialogComponent = state.options ? (
    <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this {state.options.itemName.toLowerCase()}. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={state.isDeleting} onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={state.isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {state.isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return {
    confirmDelete,
    DeleteDialog: DialogComponent,
  };
}
