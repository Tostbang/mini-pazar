import { Badge } from "@/components/ui/badge";
import { getPaymentStatusVariant } from "@/lib/order-status";
import { getPaymentStatusLabel } from "@/lib/types/enums";

/**
 * Renders a payment status as a Badge — same look-and-feel as
 * OrderStatusBadge so shop owners and customers see consistent
 * colour semantics across the orders list, the order detail, and
 * the dashboard. Wording comes from `getPaymentStatusLabel`, which
 * already maps the backend's string forms (WAITING_PAYMENT, PAID,
 * FAILED, TIMEOUT, REFUND_REQUIRED) to plain Turkish.
 *
 * Accepts the same input shape as `getPaymentStatusLabel` and
 * `getPaymentStatusVariant`: numeric enum, canonical string, or
 * legacy string (INIT/SUCCESS/FAIL) — both helpers normalise.
 */
export function PaymentStatusBadge({
  status,
  className,
}: {
  status: string | number | undefined | null;
  className?: string;
}) {
  return (
    <Badge variant={getPaymentStatusVariant(status)} className={className}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
}
