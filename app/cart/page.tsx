"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Minus,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Section } from "@/components/section"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  useClearCart,
  useGetMyCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/cart"

const paymentOptions = [
  { id: "online", label: "Online Ödeme" },
  { id: "cod", label: "Kapıda Nakit" },
  { id: "pod", label: "Kapıda POS" },
] as const

export default function CartPage() {
  const cartQuery = useGetMyCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const clearMutation = useClearCart()

  const [payment, setPayment] = useState<(typeof paymentOptions)[number]["id"]>("online")
  const [promo, setPromo] = useState("")
  const [storeOpen, setStoreOpen] = useState<Record<string, boolean>>({})

  const cart = cartQuery.data?.cart
  const items = useMemo(() => cart?.items ?? [], [cart?.items])

  const grouped = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, it) => {
      const key = it.productName ?? `Ürün #${it.productId}`
      if (!acc[key]) acc[key] = []
      acc[key].push(it)
      return acc
    }, {})
  }, [items])

  const subtotal = cart?.subTotal ?? 0
  const shippingFee = cart?.shippingFee ?? 0
  const couponDiscount = 0
  const taxes = 0
  const total = (cart?.totalAmount ?? subtotal + shippingFee) - couponDiscount + taxes

  const isMutating =
    updateMutation.isPending ||
    removeMutation.isPending ||
    clearMutation.isPending

  const handleIncrement = (cartItemId: number, quantity: number) => {
    updateMutation.mutate(
      { body: { cartItemId, quantity: quantity + 1 } },
      { onError: () => toast.error("Miktar güncellenemedi.") },
    )
  }

  const handleDecrement = (cartItemId: number, quantity: number) => {
    if (quantity <= 1) {
      removeMutation.mutate(
        { body: { cartItemId } },
        { onError: () => toast.error("Ürün kaldırılamadı.") },
      )
    } else {
      updateMutation.mutate(
        { body: { cartItemId, quantity: quantity - 1 } },
        { onError: () => toast.error("Miktar güncellenemedi.") },
      )
    }
  }

  const handleRemove = (cartItemId: number) => {
    removeMutation.mutate(
      { body: { cartItemId } },
      { onError: () => toast.error("Ürün kaldırılamadı.") },
    )
  }

  const handleClear = () => {
    if (items.length === 0) return
    clearMutation.mutate(undefined, {
      onSuccess: () => toast.success("Sepet temizlendi."),
      onError: () => toast.error("Sepet temizlenemedi."),
    })
  }

  return (
    <main className="min-h-screen bg-background pb-16 max-w-[1320px] mx-auto">
      <Header />

      <Section className="pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Ana sayfaya dön
        </Link>

        <div className="mt-4 flex items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-semibold text-brand sm:text-4xl">
            Sepetim
          </h1>
          {items.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isMutating}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Sepeti boşalt
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold text-brand">
                  Teslimat bilgisi
                </h2>
                <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-price hover:text-brand">
                  <Pencil className="size-4" />
                  Düzenle
                </button>
              </div>
              <div className="mt-5 flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-muted">
                  <MapPin className="size-7 text-brand" fill="#bbea70" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-heading text-lg font-semibold text-brand">
                    Teslimat adresi
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    Telefon:&nbsp;
                    <span className="font-semibold text-brand">
                      (+90) 554-264-1999
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    İstanbul, Kadıköy, Moda, Atatürk Caddesi No: 42
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold text-brand">
                Sepetteki ürünler
              </h2>

              {cartQuery.isLoading && items.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">Sepet yükleniyor...</p>
              ) : items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="font-heading text-lg font-semibold text-brand">
                    Sepetiniz boş
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Alışverişe başlamak için ürünlere göz atın.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-lime transition-colors hover:bg-brand/90"
                  >
                    Alışverişe başla
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {Object.entries(grouped).map(([name, vendorItems]) => {
                    const open = storeOpen[name] ?? true
                    return (
                      <div key={name} className="rounded-2xl border border-border/60">
                        <button
                          onClick={() =>
                            setStoreOpen((s) => ({ ...s, [name]: !s[name] }))
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-full bg-[#d8312a] text-white">
                              <span className="font-heading text-sm font-bold tracking-tight">
                                CART
                              </span>
                            </span>
                            <div className="text-left">
                              <p className="font-heading text-base font-semibold text-brand">
                                {name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {vendorItems.length} ürün ·{" "}
                                {vendorItems.reduce((s, it) => s + it.quantity, 0)} adet
                              </p>
                            </div>
                          </div>
                          {open ? (
                            <ChevronUp className="size-5 text-brand" />
                          ) : (
                            <ChevronDown className="size-5 text-brand" />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 px-5 pb-5">
                                {vendorItems.map((it) => (
                                  <div
                                    key={it.cartItemId}
                                    className="flex items-center gap-4 rounded-2xl bg-muted/60 p-4"
                                  >
                                    <div className="relative h-20 w-20 shrink-0 rounded-xl bg-card">
                                      {it.productImageUrl ? (
                                        <Image
                                          src={it.productImageUrl}
                                          alt={it.productName ?? "Ürün"}
                                          width={80}
                                          height={80}
                                          className="h-full w-full object-contain p-1"
                                        />
                                      ) : null}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-heading text-base font-semibold text-brand">
                                        {it.productName ?? `Ürün #${it.productId}`}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {cart?.currency ?? "TRY"} {it.unitPrice.toFixed(2)}
                                      </p>
                                      <p className="mt-1 font-heading text-xl font-bold text-price">
                                        {(it.lineTotal).toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleDecrement(it.cartItemId, it.quantity)
                                        }
                                        disabled={isMutating}
                                        className="grid size-9 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-50"
                                        aria-label="Azalt"
                                      >
                                        <Minus className="size-4" strokeWidth={2.5} />
                                      </button>
                                      <span className="min-w-6 text-center font-heading text-xl font-semibold text-price">
                                        {it.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleIncrement(it.cartItemId, it.quantity)
                                        }
                                        disabled={isMutating}
                                        className="grid size-9 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-50"
                                        aria-label="Arttır"
                                      >
                                        <Plus className="size-4" strokeWidth={2.5} />
                                      </button>
                                      <button
                                        onClick={() => handleRemove(it.cartItemId)}
                                        disabled={isMutating}
                                        className="ml-1 grid size-9 place-items-center rounded-full text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                                        aria-label="Kaldır"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
              <h2 className="font-heading text-2xl font-semibold text-brand">
                Sipariş özeti
              </h2>

              <div className="mt-5 space-y-3">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <span
                      className={`grid size-5 place-items-center rounded-full border-2 transition-colors ${
                        payment === opt.id
                          ? "border-[#d8312a]"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {payment === opt.id && (
                        <span className="size-2.5 rounded-full bg-[#d8312a]" />
                      )}
                    </span>
                    <span className="text-base text-foreground/85">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-full bg-muted/70 p-1.5 pl-5">
                <input
                  type="text"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Promosyon kodu"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-lime transition-colors hover:bg-brand/90">
                  Uygula
                </button>
              </div>

              <div className="mt-6 space-y-3 border-t border-border pt-5 text-base">
                <div className="flex items-center justify-between text-foreground/80">
                  <span>Ara toplam</span>
                  <span className="font-semibold text-price">
                    {cart?.currency ?? "TRY"} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-foreground/80">
                  <span>Teslimat ücreti</span>
                  <span className="font-semibold text-price">
                    {cart?.currency ?? "TRY"} {shippingFee.toFixed(2)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>Kupon indirimi</span>
                    <span className="font-semibold text-price">
                      -{couponDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                {taxes > 0 && (
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>Vergiler</span>
                    <span className="font-semibold text-price">
                      {taxes.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                <span className="font-heading text-xl font-semibold text-brand">
                  Toplam
                </span>
                <span className="font-heading text-2xl font-bold text-price">
                  {cart?.currency ?? "TRY"} {total.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                aria-disabled={items.length === 0 || cartQuery.isFetching}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-brand/40 bg-card py-4 text-base font-semibold text-brand transition-colors hover:bg-muted ${
                  items.length === 0 || cartQuery.isFetching
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                Devam et
                <span className="rounded-md bg-[#ffb3c7] px-2 py-0.5 font-black tracking-tight text-[#9b1248]">
                  Klarna.
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  )
}