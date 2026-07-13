"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FolderTree,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { Section } from "@/components/section"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  flattenCartItems,
  type CartCategoryGroup,
  useClearCart,
  useGetMyCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/cart"
import { useQueryOP } from "@/lib/fetch"
import { useGetMyAddress } from "@/app/(site)/account/address/_services/queries"

// TRY için Intl desteği olmayan ortamlarda "TRY 100.00" gibi basit bir
// fallback göster — locale formatlamasının başarısız olması kullanıcıyı
// fiyatsız bırakmamalı.
function formatPrice(amount: number, currency: string | null | undefined): string {
  const code = (currency?.trim() || "TRY").toUpperCase()
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: code,
    }).format(amount)
  } catch {
    return `${code} ${amount.toFixed(2)}`
  }
}

const emojiUrl = (emoji: string) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${[...emoji]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-")}.png`

function isEmojiCharacter(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.length > 8) return false
  if (/\s/.test(trimmed)) return false
  if (/[\/\\?#]/.test(trimmed)) return false
  return true
}

function CategoryIcon({
  value,
  alt,
  size = 18,
}: {
  value?: string | null
  alt: string
  size?: number
}) {
  if (!value) {
    return (
      <span
        className="grid place-items-center rounded-md bg-muted text-muted-foreground"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <FolderTree style={{ width: size - 6, height: size - 6 }} />
      </span>
    )
  }
  const src = isEmojiCharacter(value) ? emojiUrl(value) : value
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className="object-contain"
      style={{ width: size, height: size }}
    />
  )
}

export default function CartPage() {
  const cartQuery = useGetMyCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const clearMutation = useClearCart()

  // Gerçek kullanıcı adresi ve telefonu için hesap/ürün sorguları.
  // useGetMyAddress() açık adres/şehir/ülke döner; telefon profile
  // response'unda yaşadığı için ayrıca profil sorgusu çekiyoruz.
  const addressQuery = useGetMyAddress()
  const profileQuery = useQueryOP("get", "/api/User/GetMyProfile")

  // Backend artık sepeti kategori grupları halinde döndürüyor — her
  // grubun kendi adı, ikonu ve içindeki ürünleri var. Bu yüzden artık
  // ayrı bir kategori listesi ya da ürün→kategori eşlemesi çekmemize
  // gerek yok.
  const [storeOpen, setStoreOpen] = useState<Record<string, boolean>>({})

  const cart = cartQuery.data?.cart
  const groups = useMemo<CartCategoryGroup[]>(
    () => cart?.categoryGroups ?? [],
    [cart?.categoryGroups],
  )
  const items = useMemo(() => flattenCartItems(cart), [cart])

  const address = addressQuery.data?.address ?? null
  const profile = profileQuery.data?.user ?? null
  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  const phone = profile?.phone?.trim() ?? ""
  const addressLine = address?.address?.trim() ?? ""
  const city = address?.city?.trim() ?? ""
  const postalCode = address?.postalCode?.trim() ?? ""
  const country = address?.country?.trim() ?? ""
  const hasRealAddress = Boolean(addressLine || city || country)

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
                <Link
                  href="/account/address"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-price transition-colors hover:text-brand"
                >
                  <Pencil className="size-4" />
                  Düzenle
                </Link>
              </div>
              <div className="mt-5 flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-muted">
                  <MapPin className="size-7 text-brand" fill="#bbea70" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-semibold text-brand">
                    {fullName || "Teslimat adresi"}
                  </p>
                  {hasRealAddress ? (
                    <>
                      {addressLine ? (
                        <p className="mt-1 text-sm text-foreground/80">
                          {addressLine}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[postalCode, city, country].filter(Boolean).join(", ")}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Adres bilgisi eklenmemiş.{" "}
                      <Link
                        href="/account/address"
                        className="font-semibold text-price underline-offset-2 hover:underline"
                      >
                        Adres ekle
                      </Link>
                    </p>
                  )}
                  {phone ? (
                    <p className="mt-1 text-sm text-foreground/80">
                      Telefon:&nbsp;
                      <span className="font-semibold text-brand">{phone}</span>
                    </p>
                  ) : null}
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
                  {groups.map((group) => {
                    const groupProducts = group.products ?? []
                    const key = String(group.categoryId)
                    const open = storeOpen[key] ?? true
                    const headerLabel =
                      group.categoryName?.trim() || `Kategori #${group.categoryId}`
                    const itemCount = groupProducts.length
                    const unitCount = groupProducts.reduce(
                      (sum, it) => sum + it.quantity,
                      0,
                    )
                    return (
                      <div
                        key={key}
                        className="rounded-2xl border border-border/60"
                      >
                        <button
                          onClick={() =>
                            setStoreOpen((s) => ({ ...s, [key]: !s[key] }))
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-4"
                          aria-expanded={open}
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon
                              value={group.categoryIcon}
                              alt={headerLabel}
                              size={40}
                            />
                            <div className="text-left">
                              <p className="font-heading text-base font-semibold text-brand">
                                {headerLabel}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {itemCount} ürün · {unitCount} adet
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
                                {groupProducts.map((it) => (
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
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        {formatPrice(it.unitPrice, cart?.currency)}
                                      </p>
                                      <p className="mt-1 font-heading text-xl font-bold text-price">
                                        {formatPrice(it.lineTotal, cart?.currency)}
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

              {/*
                Promo kodu girişi şu an devre dışı — ileride yeniden
                açılabilir. State (`promo`, `setPromo`) kasıtlı olarak
                yorum satırının üstünde tutuldu; geri açıldığında JSX'i
                buraya geri taşımak yeterli.
              */}
              {/* <div className="mt-6 flex items-center gap-3 rounded-full bg-muted/70 p-1.5 pl-5">
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
              </div> */}

              <div className="mt-6 space-y-3 border-t border-border pt-5 text-base">
                <div className="flex items-center justify-between text-foreground/80">
                  <span>Ara toplam</span>
                  <span className="font-semibold text-price">
                    {formatPrice(subtotal, cart?.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-foreground/80">
                  <span>Teslimat ücreti</span>
                  <span className="font-semibold text-price">
                    {formatPrice(shippingFee, cart?.currency)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>Kupon indirimi</span>
                    <span className="font-semibold text-price">
                      -{formatPrice(couponDiscount, cart?.currency)}
                    </span>
                  </div>
                )}
                {taxes > 0 && (
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>Vergiler</span>
                    <span className="font-semibold text-price">
                      {formatPrice(taxes, cart?.currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                <span className="font-heading text-xl font-semibold text-brand">
                  Toplam
                </span>
                <span className="font-heading text-2xl font-bold text-price">
                  {formatPrice(total, cart?.currency)}
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
              </Link>
            </div>
          </div>
        </div>
      </Section>

    </main>
  )
}
