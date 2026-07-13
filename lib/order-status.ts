import { OrderStatus, PaymentStatus } from "@/lib/types/enums";

/**
 * Returns the Tailwind classes used to render an order status badge. The
 * palette mirrors the dashboard so a shop owner and their customer see the
 * same colour for the same status.
 */
export function getOrderStatusBadgeClasses(status: number | undefined | null) {
  if (status == null) return "bg-muted text-muted-foreground";
  switch (status as OrderStatus) {
    case OrderStatus.Pending:
    case OrderStatus.AwaitingApproval:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case OrderStatus.Confirmed:
    case OrderStatus.Preparing:
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
    case OrderStatus.Shipped:
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case OrderStatus.Delivered:
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case OrderStatus.Cancelled:
    case OrderStatus.Refunded:
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * The subset of statuses where the backend allows a customer to cancel
 * their own order (per /api/Order/CancelMyOrder docs).
 */
export function isOrderCancellable(status: number | undefined | null) {
  if (status == null) return false;
  const s = status as OrderStatus;
  return (
    s === OrderStatus.Pending ||
    s === OrderStatus.Confirmed ||
    s === OrderStatus.Preparing
  );
}

/**
 * Badge variants for payment status — mirrors the OrderStatusBadge
 * palette so the same colour always means the same intent (green-ish
 * default = paid, amber-ish secondary = waiting, red destructive =
 * failed/timeout/refund-required, neutral outline = unknown). The
 * `PaymentStatus` numeric enum is the legacy encoding; the backend
 * now emits string forms (PAID/WAITING_PAYMENT/FAILED/TIMEOUT/
 * REFUND_REQUIRED per /api/Payment/get-payment-status) so the lookup
 * here normalises both.
 */
export type PaymentStatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

const PAYMENT_STATUS_BADGE_VARIANTS: Record<string, PaymentStatusBadgeVariant> = {
  // Numeric (legacy) — values 1/2/3 from the PaymentStatus enum.
  "1": "secondary",
  "2": "default",
  "3": "destructive",
  // Canonical string forms from the backend.
  WAITING_PAYMENT: "secondary",
  INIT: "secondary",
  PAID: "default",
  SUCCESS: "default",
  FAILED: "destructive",
  FAIL: "destructive",
  TIMEOUT: "destructive",
  REFUND_REQUIRED: "destructive",
};

export function getPaymentStatusVariant(
  status: string | number | undefined | null,
): PaymentStatusBadgeVariant {
  if (status == null || status === "") return "outline";
  return PAYMENT_STATUS_BADGE_VARIANTS[String(status).toUpperCase()] ?? "outline";
}

/**
 * Once an order has been paid, the customer must request a refund rather
 * than cancel — matches the backend rule that cancel only applies to
 * non-PAID orders.
 *
 * Accepts both the numeric enum (`PaymentStatus.SUCCESS`) and the
 * canonical backend strings — "SUCCESS" (legacy) and "PAID" (current,
 * per `/api/Payment/get-payment-status`).
 */
export function isOrderPaid(paymentStatus: string | number | null | undefined) {
  if (paymentStatus == null || paymentStatus === "") return false;
  const numeric = typeof paymentStatus === "number"
    ? paymentStatus
    : Number(paymentStatus);
  if (Number.isFinite(numeric)) {
    return numeric === PaymentStatus.SUCCESS;
  }
  const upper = String(paymentStatus).toUpperCase();
  return upper === "SUCCESS" || upper === "PAID";
}

const DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatOrderDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTER.format(date);
}

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatOrderDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_ONLY_FORMATTER.format(date);
}