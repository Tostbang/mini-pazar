import { Hero } from "@/components/hero"
import { CategoryPills } from "@/components/category-pills"
import { LiveProductsSection } from "@/components/live-products-section"
import { BestSellingSection } from "@/components/best-selling-section"
import { PromoBanners, DeliveryBanner } from "@/components/promo-banners"
import { BestInTown } from "@/components/best-in-town"
import { FaqSection } from "@/components/faq-section"
import { RecommendedSection } from "@/components/recommended-section"
import { BEST_SELLING_PERIOD } from "@/lib/home-products"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background pb-16  max-w-[1320px] mx-auto">
      <Hero />
      <CategoryPills />
      <LiveProductsSection title="Mağazamızdan Ürünler" />
      <RecommendedSection title="İhtiyacınız Olabilecekler" limit={5} />
      <BestSellingSection period={BEST_SELLING_PERIOD.Weekly} limit={5} />
      <DeliveryBanner />
      <PromoBanners />
      <RecommendedSection title="Sizin İçin" limit={5} />
      <BestInTown />
      <FaqSection />
    </main>
  )
}