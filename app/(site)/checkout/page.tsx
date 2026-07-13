"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  NotebookPen,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { flattenCartItems, useGetMyCart } from "@/lib/cart";
import { useSiteSettingsStore } from "@/lib/store/site-settings-store";
import { IyzicoPaymentModal } from "./_components/iyzico-payment-modal";
import { useGetMyAddress } from "@/app/(site)/account/address/_services/queries";
import { useQueryOP } from "@/lib/fetch";
import {
  useCreateCashOnDeliveryOrder,
  useStartCheckout,
} from "./_services/queries";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Local id for the selected method — maps onto the API enum at submission
 * time. We keep this as a string at the UI level (shadcn RadioGroup deals
 * in strings) and translate to the numeric PaymentMethod when we hit the
 * endpoint.
 */
type MethodId = "online" | "cod";

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value: number | undefined | null) {
  if (value === null || value === undefined) return "—";
  try {
    return currencyFormatter.format(value);
  } catch {
    return `₺${value.toFixed(2)}`;
  }
}

/**
 * In-page result state. We hold the whole mutation response so the success
 * card can show the order number / total / state without refetching.
 * Discriminated on `kind` because the two flows return slightly different
 * shapes (COD order id vs. online checkout token + iyzico form).
 */
type ResultState =
  | {
      kind: "cod";
      orderId: number;
      orderNumber: string | null;
      orderState: number | null;
      totalAmount: number;
    }
  | {
      kind: "online";
      orderId: number;
      orderNumber: string | null;
      totalAmount: number;
      checkoutFormContent: string | null;
    };

export default function CheckoutPage() {
  const router = useRouter();
  const cartQuery = useGetMyCart();
  const initializeCheckout = useStartCheckout();
  const createCodOrder = useCreateCashOnDeliveryOrder();

  // Shop-owner-controlled flags. We honor `allowCashOnDelivery`: when the
  // shop owner hasn't enabled COD, the option is hidden entirely. Defaults
  // are defensive — if settings haven't loaded yet we show only Online
  // (the safe/safer option).
  const settings = useSiteSettingsStore((s) => s.settings);
  const allowCashOnDelivery = settings?.allowCashOnDelivery ?? false;

  const [paymentMethod, setPaymentMethod] = useState<MethodId>("online");

  // Online flow: still routed through Iyzico's hosted checkout form (the
  // backend returns HTML/JS to inject the iframe). We open the existing
  // modal when start-package-payment resolves with `checkoutFormContent`.
  const [checkoutFormHtml, setCheckoutFormHtml] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false);

  // Notes dialog: opens when the user clicks "Siparişi tamamla" so they
  // can optionally add delivery notes before the request fires.
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState("");

  // In-page result (no redirect). Lives on the page until the user
  // dismisses it (e.g. by clicking "Alışverişe dön").
  const [result, setResult] = useState<ResultState | null>(null);

  // Cart query that gives the user a contact line under the address.
  const addressQuery = useGetMyAddress();
  const profileQuery = useQueryOP("get", "/api/User/GetMyProfile");

  const cart = cartQuery.data?.cart;
  const items = useMemo(() => flattenCartItems(cart), [cart]);
  const subtotal = cart?.subTotal ?? 0;
  const shippingFee = cart?.shippingFee ?? 0;
  const total = cart?.totalAmount ?? subtotal + shippingFee;
  const isEmpty = items.length === 0;

  // Both mutations are "in flight" — disable the submit button on either.
  const isSubmitting = initializeCheckout.isPending || createCodOrder.isPending;

  // Order summary card shows a brief "who is this going to" line under the
  // totals. Address and phone are pulled from the same queries the cart
  // page uses; keep them here too so the checkout page is self-contained.
  const address = addressQuery.data?.address ?? null;
  const profile = profileQuery.data?.user ?? null;
  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const phone = profile?.phone?.trim() ?? "";
  const addressLine = address?.address?.trim() ?? "";
  const city = address?.city?.trim() ?? "";

  /**
   * Submit handler — opens the notes dialog rather than firing the
   * request directly. The actual request runs from `submitWithNotes`,
   * which is wired to the dialog's "Onayla" button.
   */
  const handlePay = () => {
    if (isEmpty) {
      toast.error("Sepetiniz boş. Önce ürün ekleyin.");
      return;
    }
    if (paymentMethod === "online" && settings?.allowOnlinePayment === false) {
      toast.error("Online ödeme şu an kapalı.");
      return;
    }
    if (paymentMethod === "cod" && !allowCashOnDelivery) {
      toast.error("Kapıda ödeme şu an kapalı.");
      return;
    }
    setNotes("");
    setShowNotesDialog(true);
  };

  const submitWithNotes = async () => {
    const trimmedNotes = notes.trim();
    setShowNotesDialog(false);

    if (paymentMethod === "cod") {
      try {
        const response = await createCodOrder.mutateAsync({
          body: {
            // Backend reads shipping fields from the user's profile per the
            // API contract; the body only carries the optional notes.
            notes: trimmedNotes || null,
          },
        });
        if (response) {
          setResult({
            kind: "cod",
            orderId: response.orderId,
            orderNumber: response.orderNumber,
            orderState: response.orderState ?? null,
            totalAmount: response.totalAmount,
          });
        }
      } catch {
        // Global onError in providers handles the toast for ApiError.
      }
      return;
    }

    // Online payment: prepare the Iyzico checkout form. We do NOT redirect
    // away from /checkout — the response renders inside the existing
    // IyzicoPaymentModal dialog. The iyzico script itself submits to
    // iyzico.com to collect card details; that's a third-party redirect
    // we can't avoid.
    setShowPaymentModal(true);
    setIsPreparingCheckout(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const response = await initializeCheckout.mutateAsync({
        body: {
          callbackUrl: `${window.location.origin}/checkout/callback`,
          idempotencyKey,
          notes: trimmedNotes || null,
        },
      });
      if (response && response.checkoutFormContent) {
        setCheckoutFormHtml(response.checkoutFormContent);
        setResult({
          kind: "online",
          orderId: response.orderId,
          orderNumber: response.orderNumber,
          totalAmount: response.totalAmount,
          checkoutFormContent: response.checkoutFormContent,
        });
      } else {
        toast.error("Ödeme formu alınamadı. Lütfen tekrar deneyin.");
        setShowPaymentModal(false);
      }
    } catch {
      setShowPaymentModal(false);
    } finally {
      setIsPreparingCheckout(false);
    }
  };

  const handlePaymentModalChange = (open: boolean) => {
    if (isPreparingCheckout && !open) return;
    setShowPaymentModal(open);
    if (!open) {
      setCheckoutFormHtml(null);
      setIsPreparingCheckout(false);
    }
  };

  // When an in-page result is showing, replace the checkout body with the
  // success card. We deliberately don't unmount the page so the React
  // state (settings, queries) survives — the user can dismiss to keep
  // browsing, or follow the next-step link.
  if (result) {
    return <CheckoutResult result={result} onDismiss={() => setResult(null)} />;
  }

  return (
    <main className="min-h-screen bg-background pb-16 max-w-[1320px] mx-auto">
      <Section className="pt-6">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
        >
          <ArrowLeft className="size-4" />
          Sepete geri dön
        </Link>

        <div className="mt-4">
          <h1 className="font-heading text-3xl font-semibold text-brand sm:text-4xl">
            Ödeme
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Siparişinizi gözden geçirin ve ödeme yönteminizi seçin.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold text-brand">
                  Ürünler ({items.length})
                </h2>
                <Link
                  href="/cart"
                  className="text-sm font-semibold text-price hover:text-brand"
                >
                  Sepete dön
                </Link>
              </div>

              {cartQuery.isLoading ? (
                <CheckoutItemsSkeleton />
              ) : isEmpty ? (
                <EmptyCart onBrowse={() => router.push("/")} />
              ) : (
                <ul className="mt-5 divide-y divide-border">
                  {items.map((item) => (
                    <li
                      key={item.cartItemId}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                        {item.productImageUrl ? (
                          <Image
                            src={item.productImageUrl}
                            alt={item.productName ?? "Ürün"}
                            fill
                            sizes="64px"
                            unoptimized
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-muted-foreground">
                            <ShoppingBag className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.productName ?? `Ürün #${item.productId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold text-brand">
                Ödeme yöntemi
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {allowCashOnDelivery
                  ? "Online ödeme Iyzico güvencesiyle, kapıda ödeme ise teslimat sırasında alınır."
                  : "Tüm ödemeler Iyzico altyapısı ile 3D Secure üzerinden gerçekleştirilir."}
              </p>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as MethodId)}
                className="mt-5"
              >
                <MethodCard
                  value="online"
                  title="Online Ödeme"
                  description={
                    settings?.allowOnlinePayment === false
                      ? "Şu an kapalı"
                      : "Iyzico güvencesiyle 3D Secure ile öde"
                  }
                  icon={CreditCard}
                  disabled={settings?.allowOnlinePayment === false}
                />
                {allowCashOnDelivery ? (
                  <MethodCard
                    value="cod"
                    title="Kapıda Ödeme"
                    description="Teslimat sırasında nakit veya kart ile öde"
                    icon={Banknote}
                  />
                ) : null}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold text-brand">
                Sipariş özeti
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <SummaryRow
                  label="Ara toplam"
                  value={formatPrice(subtotal)}
                />
                <SummaryRow
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="size-3.5" />
                      Teslimat
                    </span>
                  }
                  value={shippingFee === 0 ? "Ücretsiz" : formatPrice(shippingFee)}
                />
              </dl>

              <div className="mt-5 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Toplam
                  </span>
                  <span className="font-heading text-2xl font-bold text-price tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  KDV dahildir.
                </p>
              </div>

              <Button
                onClick={handlePay}
                disabled={isEmpty || isSubmitting}
                className="mt-6 h-14 w-full rounded-full text-base font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    İşlem sürüyor…
                  </>
                ) : (
                  <>
                    {paymentMethod === "online" ? (
                      <Lock className="size-4" />
                    ) : (
                      <Banknote className="size-4" />
                    )}
                    {paymentMethod === "online"
                      ? "Güvenli ödemeyi tamamla"
                      : "Siparişi tamamla"}
                  </>
                )}
              </Button>

              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                {paymentMethod === "online"
                  ? "Bilgileriniz Iyzico tarafından 256-bit SSL ile şifrelenir."
                  : "Siparişiniz mağaza tarafından onaylandıktan sonra hazırlanır."}
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Teslimat</p>
              <p className="mt-1 inline-flex items-start gap-1.5 leading-relaxed">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {[fullName, addressLine, city].filter(Boolean).join(" · ") ||
                    "Profil adresiniz kullanılacak"}
                  {phone ? ` · ${phone}` : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Section>

      <IyzicoPaymentModal
        open={showPaymentModal}
        onOpenChange={handlePaymentModalChange}
        checkoutFormHtml={checkoutFormHtml}
        isPreparingCheckout={isPreparingCheckout}
      />

      <NotesDialog
        open={showNotesDialog}
        onOpenChange={setShowNotesDialog}
        notes={notes}
        onNotesChange={setNotes}
        onConfirm={submitWithNotes}
        isSubmitting={isSubmitting}
        method={paymentMethod}
      />
    </main>
  );
}

/**
 * One row in the payment-method RadioGroup. Built on shadcn primitives so
 * the focus / disabled / checked states match the rest of the design
 * system. The whole card is the click target; the RadioGroupItem is
 * visually nested inside.
 */
function MethodCard({
  value,
  title,
  description,
  icon: Icon,
  disabled = false,
}: {
  value: MethodId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  return (
    <Label
      htmlFor={`method-${value}`}
      className={`flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-brand/40 has-[[data-checked]]:border-brand has-[[data-checked]]:bg-brand/5 has-[[data-checked]]:shadow-sm ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground has-[[data-checked]]:bg-brand has-[[data-checked]]:text-brand-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <RadioGroupItem
        id={`method-${value}`}
        value={value}
        disabled={disabled}
        className="mt-1"
      />
    </Label>
  );
}

/**
 * Notes dialog. Notes are optional; we still require an explicit click on
 * "Onayla" to fire the request (rather than triggering on dialog open)
 * so the user can review the method before submitting.
 */
function NotesDialog({
  open,
  onOpenChange,
  notes,
  onNotesChange,
  onConfirm,
  isSubmitting,
  method,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  method: MethodId;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="size-4" />
            Sipariş notu (opsiyonel)
          </DialogTitle>
          <DialogDescription>
            Teslimatla ilgili eklemek istediğiniz bir not varsa yazabilirsiniz.
            Boş bırakıp doğrudan onaylayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={
            method === "cod"
              ? "Örn. Kapıcıya bırakabilirsiniz."
              : "Örn. Kapıcıya bırakabilirsiniz."
          }
          rows={4}
          maxLength={500}
          autoFocus
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Gönderiliyor…
              </>
            ) : (
              <>
                {method === "online" ? (
                  <Lock className="size-4" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Onayla
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * In-page success card. Replaces the checkout body once a request resolves
 * — no redirect, the user can stay on /checkout and either browse more or
 * head to their orders. For online we still surface the Iyzico modal so
 * they can complete card details.
 */
function CheckoutResult({
  result,
  onDismiss,
}: {
  result: ResultState;
  onDismiss: () => void;
}) {
  return (
    <main className="min-h-screen bg-background pb-16 max-w-[1320px] mx-auto">
      <Section className="pt-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-card p-8 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-semibold text-brand sm:text-3xl">
            {result.kind === "cod"
              ? "Siparişiniz alındı!"
              : "Ödeme hazırlanıyor"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.kind === "cod"
              ? "Kapıda ödeme için siparişiniz oluşturuldu. Mağaza onayının ardından hazırlanmaya başlanacak."
              : "Siparişiniz oluşturuldu. Aşağıdaki butonla güvenli ödeme formuna geçebilirsiniz."}
          </p>

          <dl className="mt-6 grid gap-3 rounded-2xl bg-muted/60 p-5 text-left text-sm">
            <ResultRow label="Sipariş no" value={result.orderNumber ?? `#${result.orderId}`} />
            <ResultRow label="Tutar" value={formatPrice(result.totalAmount)} />
            {result.kind === "cod" && result.orderState != null ? (
              <ResultRow label="Durum" value={getOrderStateLabel(result.orderState)} />
            ) : null}
          </dl>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              render={
                <Link href="/">Alışverişe dön</Link>
              }
            />
            {result.kind === "online" ? (
              <Button variant="outline" onClick={onDismiss}>
                Ödeme formuna geç
              </Button>
            ) : (
              <Button variant="outline" onClick={onDismiss}>
                Yeni sipariş oluştur
              </Button>
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}

function ResultRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function CheckoutItemsSkeleton() {
  return (
    <ul className="mt-5 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-background text-muted-foreground">
        <ShoppingBag className="size-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Sepetiniz boş
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Ödeme yapabilmek için sepetinize en az bir ürün eklemelisiniz.
      </p>
      <Button size="sm" onClick={onBrowse}>
        Alışverişe başla
      </Button>
    </div>
  );
}

/**
 * Map the numeric OrderStatus returned by the API to a Turkish label. We
 * intentionally inline the small set of states the user can see right
 * after a COD order is created; full status history lives in the orders
 * page.
 */
function getOrderStateLabel(state: number): string {
  switch (state) {
    case 1:
      return "Beklemede";
    case 2:
      return "Onaylandı";
    case 3:
      return "Hazırlanıyor";
    case 4:
      return "Kargoda";
    case 5:
      return "Teslim edildi";
    case 6:
      return "İptal edildi";
    default:
      return `#${state}`;
  }
}
