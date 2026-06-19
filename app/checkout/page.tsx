"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyCart } from "@/lib/cart";
import { IyzicoPaymentModal } from "./_components/iyzico-payment-modal";
import { useInitializeIyzicoCheckout } from "./_services/queries";

const paymentMethods = [
  {
    id: "card",
    title: "Kredi / Banka Kartı",
    description: "Iyzico güvencesiyle 3D Secure ile öde",
    icon: CreditCard,
  },
  {
    id: "wallet",
    title: "Dijital Cüzdan",
    description: "Papara, BKM Express, Apple Pay, Google Pay",
    icon: Wallet,
  },
  {
    id: "klarna",
    title: "Klarna ile Öde",
    description: "Şimdi al, 14 gün içinde öde. 0₺ faiz.",
    icon: ShieldCheck,
  },
] as const;

type PaymentMethodId = (typeof paymentMethods)[number]["id"];

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

export default function CheckoutPage() {
  const router = useRouter();
  const cartQuery = useGetMyCart();
  const initializeCheckout = useInitializeIyzicoCheckout();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const [checkoutFormHtml, setCheckoutFormHtml] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const cart = cartQuery.data?.cart;
  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const subtotal = cart?.subTotal ?? 0;
  const shippingFee = cart?.shippingFee ?? 0;
  const total = cart?.totalAmount ?? subtotal + shippingFee;
  const isEmpty = items.length === 0;

  const handlePay = async () => {
    if (isEmpty) {
      toast.error("Sepetiniz boş. Önce ürün ekleyin.");
      return;
    }
    try {
      const response = await initializeCheckout.mutateAsync({
        body: {
          totalAmount: total,
          currency: cart?.currency ?? "TRY",
          callbackUrl: `${window.location.origin}/checkout/callback`,
          items: items.map((it) => ({
            productId: it.productId,
            productName: it.productName ?? `Ürün #${it.productId}`,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        },
      });
      if (response && response.checkoutFormContent) {
        setCheckoutFormHtml(response.checkoutFormContent);
        setShowPaymentModal(true);
      } else {
        toast.error("Ödeme formu alınamadı. Lütfen tekrar deneyin.");
      }
    } catch {
      // Global onError in providers handles the toast for ApiError.
    }
  };

  return (
    <main className="min-h-screen bg-background pb-16 max-w-[1320px] mx-auto">
      <Header />

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
            Siparişinizi gözden geçirin ve güvenli ödeme yönteminizi seçin.
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
                Tüm ödemeler Iyzico altyapısı ile 3D Secure üzerinden
                gerçekleştirilir.
              </p>

              <div className="mt-5 space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
                        isActive
                          ? "border-brand bg-brand/5 shadow-sm"
                          : "border-border bg-background hover:border-brand/40"
                      }`}
                    >
                      <span
                        className={`grid size-11 place-items-center rounded-xl ${
                          isActive
                            ? "bg-brand text-brand-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {method.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                      <span
                        className={`grid size-5 place-items-center rounded-full border-2 ${
                          isActive
                            ? "border-brand bg-brand"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isActive ? (
                          <span className="size-2 rounded-full bg-brand-foreground" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                disabled={isEmpty || initializeCheckout.isPending}
                className="mt-6 h-14 w-full rounded-full text-base font-bold"
              >
                {initializeCheckout.isPending ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Iyzico'ya yönlendiriliyor…
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    Güvenli ödemeyi tamamla
                  </>
                )}
              </Button>

              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Bilgileriniz Iyzico tarafından 256-bit SSL ile şifrelenir.
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Klarna ile esnek ödeme
              </p>
              <p className="mt-1 leading-relaxed">
                Klarna yöntemini seçtiğinizde, siparişinizi teslim aldıktan
                sonra 14 güne kadar ödeyebilirsiniz. Yönlendirildiğiniz Iyzico
                sayfasından kartınızla veya banka havalesiyle ödeme
                tamamlayabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <IyzicoPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        checkoutFormHtml={checkoutFormHtml}
      />

      <Footer />
    </main>
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
