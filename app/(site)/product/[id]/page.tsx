import { ProductDetailView } from "./_components/product-detail";

/**
 * /product/[id] — tek ürün detay sayfası.
 *
 * Server component yalnızca route parametresini doğrular; veri çekme ve
 * tüm UI client component içinde (TanStack Query üzerinden).
 *
 * `dynamic = "force-dynamic"` çünkü sayfa kullanıcıya özel fiyat/stok
 * gösteriyor ve ürün kataloğu sürekli güncelleniyor — Next.js'in
 * build-time'da statik generate etmesini istemiyoruz.
 */
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId) || productId <= 0) {
    return <ProductDetailView productId={0} />;
  }

  return <ProductDetailView productId={productId} />;
}