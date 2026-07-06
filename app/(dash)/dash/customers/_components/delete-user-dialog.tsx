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
import { useDeleteUser, type AdminUser } from "../_services/queries";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  /**
   * Soft-delete başarıyla tamamlandıktan sonra çağrılır. Listeyi
   * invalidate etmek genelde yeterli olsa da, detay sayfası gibi
   * bağlamda listeye geri dönmek için kullanılır.
   */
  onDeleted?: () => void;
}

function fullName(user: AdminUser | null) {
  if (!user) return "Bu kullanıcı";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || `Kullanıcı #${user.userId}`;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onDeleted,
}: DeleteUserDialogProps) {
  const deleteMutation = useDeleteUser();

  const onConfirm = async () => {
    if (!user) return;
    try {
      await deleteMutation.mutateAsync({
        params: { query: { targetUserId: user.userId } },
      });
      toast.success("Kullanıcı silindi.");
      onOpenChange(false);
      onDeleted?.();
    } catch {
      toast.error("Kullanıcı silinirken bir hata oluştu.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Kullanıcıyı silmek istiyor musunuz?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">
              {fullName(user)}
            </span>{" "}
            pasife çekilecek ve aktif oturumları kapatılacak. Bu işlem geri
            alınamaz.
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
