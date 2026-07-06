"use client";

import { Loader2, XCircle } from "lucide-react";
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
import { useCancelMyOrder } from "@/lib/orders";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  orderNumber?: string | null;
  onCancelled?: () => void;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onCancelled,
}: CancelOrderDialogProps) {
  const cancelMutation = useCancelMyOrder();

  const onConfirm = async () => {
    if (orderId == null) return;
    try {
      await cancelMutation.mutateAsync({
        params: { path: { orderId } },
      });
      toast.success("Sipariş iptal edildi.");
      onCancelled?.();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sipariş iptal edilirken bir hata oluştu.";
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <XCircle className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Siparişi iptal etmek istiyor musunuz?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">
              {orderNumber ?? "Bu sipariş"}
            </span>{" "}
            iptal edilecek. Kapıda ödeme siparişlerinde stok iade edilir; online
            ödemelerde iade süreci başlatılır. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            Vazgeç
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            {cancelMutation.isPending ? "İptal ediliyor..." : "Siparişi iptal et"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}