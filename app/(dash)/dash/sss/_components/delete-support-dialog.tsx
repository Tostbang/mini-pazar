"use client";

import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDeleteSupport,
  type SupportListItem,
} from "../_services/queries";

interface DeleteSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SupportListItem | null;
}

export function DeleteSupportDialog({
  open,
  onOpenChange,
  item,
}: DeleteSupportDialogProps) {
  const deleteMutation = useDeleteSupport();

  const onConfirm = async () => {
    if (!item) return;
    try {
      await deleteMutation.mutateAsync({
        body: { supportId: item.supportId },
      });
      toast.success("SSS kaydı silindi.");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "SSS kaydı silinirken bir hata oluştu.";
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>SSS kaydını silmek istiyor musunuz?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">
              {item?.question ?? "Bu kayıt"}
            </span>{" "}
            silinecek. Kayıt veritabanından kaldırılır, mağaza vitrininde
            görünmez. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            İptal
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}