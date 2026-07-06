import { OrderStatus, type OrderStatus as OrderStatusType } from "@/lib/types/enums";

export type OrderStatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

/**
 * Sipariş durumlarının Badge varyant eşlemesi. Backend kritik
 * durumları (iptal/iade) `destructive`, aktif/başarılı durumları
 * `default`, bilgilendirici durumları `secondary` veya `outline`
 * olarak gösterir.
 */
export const ORDER_STATUS_BADGE_VARIANTS: Record<
  OrderStatusType,
  OrderStatusBadgeVariant
> = {
  [OrderStatus.Pending]: "secondary",
  [OrderStatus.AwaitingApproval]: "secondary",
  [OrderStatus.Confirmed]: "default",
  [OrderStatus.Preparing]: "default",
  [OrderStatus.Shipped]: "default",
  [OrderStatus.Delivered]: "outline",
  [OrderStatus.Cancelled]: "destructive",
  [OrderStatus.Refunded]: "destructive",
};

export function getOrderStatusVariant(
  status: number | undefined | null,
): OrderStatusBadgeVariant {
  if (status == null) return "outline";
  return ORDER_STATUS_BADGE_VARIANTS[status as OrderStatusType] ?? "outline";
}
