"use client"

import Link from "next/link"
import { ArrowRight, Zap, ShoppingBag, Truck, CheckCircle2 } from "lucide-react"
import { motion } from "motion/react"
import { Section } from "@/components/section"

const stores = [
  {
    name: "Crush Market",
    color: "bg-[#ff4d4d]",
    icon: ShoppingBag,
    pattern: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)",
  },
  {
    name: "Teslimat Market",
    color: "bg-[#2d5af0]",
    icon: Truck,
    pattern: "radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 40%)",
  },
  {
    name: "Kaliteli Ürün",
    color: "bg-[#00c5a0]",
    icon: CheckCircle2,
    pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 40%)",
  },
]

export function FeaturedStores() {
  return (
    <Section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-intro text-2xl font-extrabold  sm:text-3xl">Öne çıkan mağaza</h2>
        <Link
          href="#"
          className="flex items-center gap-1.5 text-sm font-bold text-orange-600 transition-colors hover:text-orange-700"
        >
          Tüm mağazaları ziyaret et <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stores.map((store, i) => (
          <motion.div
            key={store.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className={`relative overflow-hidden rounded-3xl ${store.color} p-6 text-white shadow-lg`}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{ backgroundImage: store.pattern }}
            />
            
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <store.icon className="size-8" />
              </div>
              
              <div>
                <h3 className="font-heading text-xl font-bold">{store.name}</h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-white/90">
                  <Zap className="size-3.5 fill-amber-300 text-amber-300" />
                  12 dakikada teslimat
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
