"use client";

import Image from "next/image";
import { CreditCard, ClockIcon, ShoppingBasket, GiftIcon } from "lucide-react";
import Gift from "@/public/banner-images/Gift.svg";
import Clock from "@/public/banner-images/Clock.svg";
import { motion } from "motion/react";
import { Section } from "@/components/section";
import Line from "@/public/banner-images/squish-line.svg";
import Line2 from "@/public/banner-images/squish-line-2.svg";
import seller from "@/public/banner-images/seller.png";
import waveLines from "@/public/banner-images/wave-line.svg";

export function PromoBanners() {
  return (
    <Section className="grid gap-4 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-[30px] bg-[#083e74] p-7 text-white"
      >
        <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/80 text-[#083e74] px-3 py-1 text-[13px] font-semibold">
          <GiftIcon className="size-4" /> Ücretsiz teslimat
        </span>
        <div className="flex items-center">
          <p className="mt-4 w-2/3 font-heading text-2xl font-semibold leading-tight sm:text-[32px] text-white/80">
            %50'ye varan indirim 12:15'e kadar teslimat Hızlı ve ücretsiz
          </p>
          <div className="w-1/3 flex justify-center">
            <div className="w-36">
              <Image
                src={Gift}
                alt="gift"
                width={200}
                height={200}
                className="w-full h-full max-w-full max-h-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-[30px] bg-[#a9411e] p-7 text-white"
      >
        <Image
          src={Line}
          alt="line"
          width={300}
          height={300}
          className="absolute w-36 opacity-20 left-1/2 bottom-0 z-0"
        />

        <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/80 text-[#a9411e] px-3 py-1 text-[13px] font-semibold">
          <CreditCard className="size-4.5" /> Üyelik kartı
        </span>
        <div className="flex items-center z-1 relative">
          <p className="mt-4 w-2/3 font-heading text-2xl font-semibold leading-tight sm:text-[32px] text-white/80">
            Sağlık kartımızı kullanarak %5 indirim kazanabilirsiniz
          </p>
          <div className="w-1/3 flex justify-center">
            <div className="w-36">
              <Image
                src={Clock}
                alt="gift"
                width={200}
                height={200}
                className="w-full h-full max-w-full max-h-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#9b4413] p-7 text-amber-100"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-1 text-xs font-semibold">
          <CreditCard className="size-3.5" /> Üyelik kartı
        </span>
        <p className="mt-4 font-heading text-2xl font-semibold leading-tight sm:text-[28px]">
          Sağlık kartımızı
          <br />
          kullanarak %5 indirim
          <br />
          kazanabilirsiniz
        </p>
        <Clock
          className="absolute -bottom-4 right-4 size-28 text-amber-300"
          strokeWidth={1.5}
        />
      </motion.div> */}
    </Section>
  );
}

export function DeliveryBanner() {
  return (
    <Section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[60vh] flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2.5rem] bg-[#6c1143] p-8 text-white sm:flex-row sm:items-center sm:p-12"
      >
        <Image
          src={Line2}
          alt="line"
          width={300}
          height={300}
          className="absolute w-[300px]  left-[45%] -bottom-8 z-0"
        />
        <Image
          src={Line}
          alt="line"
          width={300}
          height={300}
          className="absolute w-36 opacity-20 left-2 rotate-30 top-5 z-0"
        />

        <Image
          src={waveLines}
          alt="line"
          width={300}
          height={300}
          className="absolute w-52 opacity-20 right-0 top-0 z-0"
        />

        <div className="relative z-10 max-w-xl">
          <h3 className="font-heading text-3xl font-semibold leading-tight sm:text-[44px] text-white/90">
            Evde Kalın, Tüm İhtiyaçlarınızı Marketimizden Alın!
          </h3>
          <p className="mt-4 text-sm font-medium text-white/70">
            App Store veya Google Play'den uygulamayı indirin
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <button className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 transition-transform hover:scale-105">
              <Image
                src="/banner-images/Google play.svg"
                alt="Google Play"
                width={24}
                height={24}
              />
              <div className="text-left">
                <p className="text-[10px] uppercase leading-none opacity-70">
                  İndirin
                </p>
                <p className="text-md font-base leading-none">Google Play</p>
              </div>
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 transition-transform hover:scale-105">
              <Image
                src="/banner-images/Apple logo.svg"
                alt="App Store"
                width={24}
                height={24}
              />
              <div className="text-left">
                <p className="text-[10px] uppercase leading-none opacity-70">
                  İndirin
                </p>
                <p className="text-md font-base leading-none">App Store</p>
              </div>
            </button>
          </div>
        </div>

        {/* This would be the person image, using a div to represent the space */}
        <div className="relative w-full sm:absolute sm:right-10 sm:top-0 sm:h-full sm:w-[40%] pt-12">
          {/* Placeholder for the delivery person illustration */}
          <div className="h-full">
            <Image
              src={seller}
              alt="seller"
              width={2000}
              height={2000}
              className="w-full h-full object-contain"
            />
          </div>

          {/* <div className="flex h-full items-center justify-center opacity-20"> */}
          {/*   <ShoppingBasket className="size-48" /> */}
          {/* </div> */}
        </div>
      </motion.div>
    </Section>
  );
}
