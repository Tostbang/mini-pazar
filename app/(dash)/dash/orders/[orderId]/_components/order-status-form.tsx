"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/format";
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
} from "@/lib/types/enums";
import { useUpdateOrderStatus } from "../../_services/queries";

/**
 * İptal/iade durumlarında backend stokları geri veriyor; bu yüzden
 * adminin sebep belirtebilmesi için ek bir alan gösteriyoruz.
 */
const REQUIRES_REASON_STATUSES = new Set<OrderStatus>([
  OrderStatus.Cancelled,
  OrderStatus.Refunded,
]);

function requiresReason(status: OrderStatus) {
  return REQUIRES_REASON_STATUSES.has(status);
}

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentNotes,
}: {
  orderId: number;
  currentStatus: OrderStatus;
  currentNotes?: string | null;
}) {
  const updateStatus = useUpdateOrderStatus();

  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [reason, setReason] = useState<string>(
    currentNotes && requiresReason(currentStatus) ? currentNotes : "",
  );

  // Sunucudan gelen mevcut durum değişirse (örn. başka bir admin
  // güncelledi) yerel state'i senkron tut.
  useEffect(() => {
    setStatus(currentStatus);
    if (!requiresReason(currentStatus)) {
      setReason("");
    }
  }, [currentStatus]);

  const showReason = requiresReason(status);
  const reasonRequired = showReason && reason.trim().length === 0;
  const isDirty =
    status !== currentStatus ||
    (showReason && reason.trim() !== (currentNotes?.trim?.() ?? ""));
  const isSubmitting = updateStatus.isPending;

  const onSubmit = async () => {
    if (orderId <= 0) return;
    if (showReason && reasonRequired) {
      toast.error("Lütfen iptal/iade sebebini yazın.");
      return;
    }
    try {
      await updateStatus.mutateAsync({
        body: {
          orderId,
          orderState: status,
          cancelledReason: showReason ? reason.trim() : null,
        },
      });
      toast.success("Sipariş durumu güncellendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sipariş durumu güncellenirken bir hata oluştu.";
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="order-status"
          className="text-sm font-medium text-foreground"
        >
          Sipariş Durumu
        </label>
        <Select
          value={String(status)}
          onValueChange={(value) => setStatus(Number(value) as OrderStatus)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="order-status" className="h-9 w-full">
            <SelectValue placeholder="Durum seçin">
              {ORDER_STATUS_LABELS[status]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showReason && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="order-status-reason"
            className="text-sm font-medium text-foreground"
          >
            Sebep
          </label>
          <Textarea
            id="order-status-reason"
            placeholder={
              status === OrderStatus.Cancelled
                ? "İptal sebebini kısaca açıklayın"
                : "İade sebebini kısaca açıklayın"
            }
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            disabled={isSubmitting}
            aria-invalid={reasonRequired}
          />
          {reasonRequired && (
            <p className="text-xs font-medium text-destructive">
              Bu işlem için bir sebep belirtilmelidir.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !isDirty || (showReason && reasonRequired)}
          className={cn(isDirty && "ring-2 ring-primary/30")}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isSubmitting ? "Kaydediliyor..." : "Durumu Güncelle"}
        </Button>
      </div>
    </div>
  );
}
