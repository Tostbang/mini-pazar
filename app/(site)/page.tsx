import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { EmojiFinder } from "@/components/emoji-finder"
import { CategoryPills } from "@/components/category-pills"
import { ProductSection } from "@/components/product-section"
import { LiveProductsSection } from "@/components/live-products-section"
import { OfferCards } from "@/components/offer-cards"
import { BestSelling } from "@/components/best-selling"
import { PromoBanners, DeliveryBanner } from "@/components/promo-banners"
import { FeaturedStores } from "@/components/featured-stores"
import { BestInTown } from "@/components/best-in-town"
import { youMightNeed, justForYou, mostSelling } from "@/lib/products"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background pb-16  max-w-[1320px] mx-auto">
      <Header />
      <Hero />
      <CategoryPills />
      <LiveProductsSection title="Mağazamızdan Ürünler" />
      <ProductSection title="You might need" ids={youMightNeed} />
      <FeaturedStores />
      <BestSelling />
      <DeliveryBanner />
      <ProductSection title="Most selling products" ids={mostSelling} />
      <PromoBanners />
      <ProductSection title="Just for you" ids={justForYou} />
      <BestInTown />
    </main>
  )
}
