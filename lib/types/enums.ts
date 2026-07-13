/**
 * Backend `MarketEntity.Enum` namespace'inden gelen enum değerlerinin
 * tip güvenli TypeScript karşılıkları. OpenAPI spec enum isimlerini
 * yayınlamadığı için generated `api.d.ts` yalnızca tam-sayı literal
 * tipleri (`1 | 2 | 3 | ...`) üretiyor — bu dosya UI katmanında ham
 * sayı yerine isimlendirilmiş sabitlerin kullanılmasını sağlıyor.
 *
 * Backend C# enum tanımlarıyla birebir eşleşmelidir; değişiklik
 * olduğunda burayı da güncelleyin.
 */

export const OrderStatus = {
  Pending: 1,
  AwaitingApproval: 2,
  Confirmed: 3,
  Preparing: 4,
  Shipped: 5,
  Delivered: 6,
  Cancelled: 7,
  Refunded: 8,
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "Beklemede",
  [OrderStatus.AwaitingApproval]: "Onay Bekliyor",
  [OrderStatus.Confirmed]: "Onaylandı",
  [OrderStatus.Preparing]: "Hazırlanıyor",
  [OrderStatus.Shipped]: "Kargoda",
  [OrderStatus.Delivered]: "Teslim Edildi",
  [OrderStatus.Cancelled]: "İptal Edildi",
  [OrderStatus.Refunded]: "İade Edildi",
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: OrderStatus.Pending, label: ORDER_STATUS_LABELS[OrderStatus.Pending] },
  {
    value: OrderStatus.AwaitingApproval,
    label: ORDER_STATUS_LABELS[OrderStatus.AwaitingApproval],
  },
  {
    value: OrderStatus.Confirmed,
    label: ORDER_STATUS_LABELS[OrderStatus.Confirmed],
  },
  {
    value: OrderStatus.Preparing,
    label: ORDER_STATUS_LABELS[OrderStatus.Preparing],
  },
  { value: OrderStatus.Shipped, label: ORDER_STATUS_LABELS[OrderStatus.Shipped] },
  {
    value: OrderStatus.Delivered,
    label: ORDER_STATUS_LABELS[OrderStatus.Delivered],
  },
  {
    value: OrderStatus.Cancelled,
    label: ORDER_STATUS_LABELS[OrderStatus.Cancelled],
  },
  {
    value: OrderStatus.Refunded,
    label: ORDER_STATUS_LABELS[OrderStatus.Refunded],
  },
];

export function getOrderStatusLabel(status: number | undefined | null) {
  if (status == null) return "—";
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? "—";
}

export const PaymentMethod = {
  CashOnDelivery: 1,
  OnlinePayment: 2,
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CashOnDelivery]: "Kapıda Ödeme",
  [PaymentMethod.OnlinePayment]: "Online Ödeme",
};

export function getPaymentMethodLabel(method: number | undefined | null) {
  if (method == null) return "—";
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? "—";
}

export const PaymentStatus = {
  INIT: 1,
  SUCCESS: 2,
  FAIL: 3,
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// Numeric fallback labels (legacy encoding). Wording matches the string
// table below so the customer always sees the same Turkish phrase
// regardless of whether the backend returned a number or a string.
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.INIT]: "Ödeme Bekleniyor",
  [PaymentStatus.SUCCESS]: "Ödendi",
  [PaymentStatus.FAIL]: "Ödeme Başarısız",
};

/**
 * String forms the backend can return — per
 * `/api/Payment/get-payment-status` docs: WAITING_PAYMENT, PAID, FAILED,
 * TIMEOUT, REFUND_REQUIRED. The legacy INIT/SUCCESS/FAIL strings are
 * also included so old payloads don't leak through untranslated.
 *
 * Wording is plain Turkish for non-technical users (the target audience
 * is the shop owner on the dashboard and the customer on the orders
 * page) — no jargon, no English.
 */
const PAYMENT_STATUS_STRING_LABELS: Record<string, string> = {
  WAITING_PAYMENT: "Ödeme Bekleniyor",
  PAID: "Ödendi",
  FAILED: "Ödeme Başarısız",
  TIMEOUT: "Ödeme Süresi Doldu",
  REFUND_REQUIRED: "İade Gerekli",
  INIT: "Ödeme Bekleniyor",
  SUCCESS: "Ödendi",
  FAIL: "Ödeme Başarısız",
};

export function getPaymentStatusLabel(status: string | number | undefined | null) {
  if (status == null || status === "") return "—";
  const numeric = typeof status === "number" ? status : Number(status);
  if (Number.isFinite(numeric) && PAYMENT_STATUS_LABELS[numeric as PaymentStatus]) {
    return PAYMENT_STATUS_LABELS[numeric as PaymentStatus];
  }
  // Look up the uppercase form so callers can pass either case.
  return PAYMENT_STATUS_STRING_LABELS[String(status).toUpperCase()] ?? String(status);
}
