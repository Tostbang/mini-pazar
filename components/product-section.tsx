"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"
import { ProductCard } from "@/components/product-card"
import { products } from "@/lib/products"
import { Section } from "@/components/section"
import SectionTitle from "./SectionTitle"

export function ProductSection({
  title,
  ids,
  seeMoreHref = "#",
}: {
  title: string
  ids: string[]
  seeMoreHref?: string
}) {
  const cols = 5

  return (
    <Section>
      <div className="mb-5 flex items-center justify-between">
      <SectionTitle>{title}</SectionTitle>
        <Link
          href={seeMoreHref}
          className="flex items-center gap-1.5 text-sm font-bold text-orange-600 transition-colors hover:text-orange-700"
        >
          Daha fazla <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ids.map((id, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (i % cols) * 0.06 }}
          >
            <ProductCard product={products[id]} />
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
