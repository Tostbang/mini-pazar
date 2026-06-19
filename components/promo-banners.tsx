"use client"

import Image from "next/image"
import { Gift, CreditCard, Clock, ShoppingBasket } from "lucide-react"
import { motion } from "motion/react"
import { Section } from "@/components/section"

export function PromoBanners() {
  return (
    <Section className="grid gap-4 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#1c3f73] p-7 text-white"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Gift className="size-3.5" /> Ücretsiz teslimat
        </span>
        <p className="mt-4 font-heading text-2xl font-semibold leading-tight sm:text-[28px]">
          %50'ye varan indirim
          <br />
          12:15'e kadar teslimat
          <br />
          Hızlı ve ücretsiz
        </p>
        <Gift className="absolute -bottom-4 right-4 size-28 text-emerald-400" strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#9b4413] p-7 text-amber-100"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <CreditCard className="size-3.5" /> Üyelik kartı
        </span>
        <p className="mt-4 font-heading text-2xl font-semibold leading-tight sm:text-[28px]">
          Sağlık kartımızı
          <br />
          kullanarak %5 indirim
          <br />
          kazanabilirsiniz
        </p>
        <Clock className="absolute -bottom-4 right-4 size-28 text-amber-300" strokeWidth={1.5} />
      </motion.div>
    </Section>
  )
}

export function DeliveryBanner() {
  return (
    <Section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2.5rem] bg-[#5a1530] p-8 text-white sm:flex-row sm:items-center sm:p-12"
      >
        <div className="relative z-10 max-w-lg">
          <h3 className="font-heading text-3xl font-semibold leading-tight sm:text-[40px]">
            Evde Kalın, Tüm
            <br />
            İhtiyaçlarınızı
            <br />
            Marketimizden Alın!
          </h3>
          <p className="mt-4 text-sm font-medium text-white/70">
            App Store veya Google Play'den uygulamayı indirin
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <button className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 transition-transform hover:scale-105">
              <Image src="/placeholder.svg" alt="Google Play" width={24} height={24} className="invert" />
              <div className="text-left">
                <p className="text-[10px] uppercase leading-none opacity-70">İndirin</p>
                <p className="text-sm font-bold leading-none">Google Play</p>
              </div>
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 transition-transform hover:scale-105">
              <Image src="/placeholder.svg" alt="App Store" width={24} height={24} className="invert" />
              <div className="text-left">
                <p className="text-[10px] uppercase leading-none opacity-70">İndirin</p>
                <p className="text-sm font-bold leading-none">App Store</p>
              </div>
            </button>
          </div>
        </div>

        {/* This would be the person image, using a div to represent the space */}
        <div className="relative h-64 w-full sm:absolute sm:right-10 sm:top-0 sm:h-full sm:w-[40%]">
           {/* Placeholder for the delivery person illustration */}
           <div className="flex h-full items-center justify-center opacity-20">
              <ShoppingBasket className="size-48" />
           </div>
        </div>
      </motion.div>
    </Section>
  )
}
