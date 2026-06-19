"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Section } from "@/components/section";

export function Hero() {
  return (
    <Section className="pt-5">
      <div className="relative rounded-1.5xl bg-brand text-brand-foreground ">
        {/* Subtle product pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
        />
        <div className="overflow-hidden">
          <div className="relative grid items-center gap-6 px-6 py-10 sm:px-12 sm:pb-10 sm:pt-8 md:grid-cols-2 ">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-intro font-semibold leading-[1.05] text-balance sm:text-5xl lg:text-[3.65rem]">
                Marketi ayaginiza
                <br />
                getiriyoruz
              </h1>
              <p className="mt-4 max-w-md text-pretty leading-relaxed text-brand-foreground/80">
                Organik ürünler ve sürdürülebilir kaynakli
                <br className="hidden sm:block" />
                market teslimati, %4'e varan indirimle.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="mt-7 rounded-lg bg-lime px-9 py-3.5 font-heading text-lg font-semibold text-lime-foreground shadow-lg"
              >
                Şimdi incele
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative mx-auto h-56 w-full max-w-md sm:h-72 md:h-80 "
            >
              <Image
                src="/products/grocery-bag.png"
                alt="Taze ürünlerle dolu market poseti"
                fill
                priority
                className="object-contain"
              />
            </motion.div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute z-0 w-full text-background">
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className=" w-full"
          >
            <path
              d="M0,0 
	      L1440,0 
	      L1440,0 
	      L1430,0 
	      Q720,50 10,0
	      L0,0 
		Z"
              fill="#064C4F"
            />
          </svg>
        </div>
      </div>
    </Section>
  );
}

export function example() {
  return (
    <Section className="pt-5">
      <div className="relative rounded-lg bg-brand text-brand-foreground">
        {/* Subtle product pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
        />
        <div className="relative grid items-center gap-6 px-6 py-10 sm:px-12 sm:pb-16 sm:pt-12 md:grid-cols-2 md:pb-20 md:pt-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] text-balance sm:text-5xl lg:text-[3.65rem]">
              Marketi ayaginiza
              <br />
              getiriyoruz
            </h1>
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-brand-foreground/80">
              Organik ürünler ve sürdürülebilir kaynakli
              <br className="hidden sm:block" />
              market teslimati, %4'e varan indirimle.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="mt-7 rounded-lg bg-lime px-8 py-3.5 font-heading text-lg font-semibold text-lime-foreground shadow-lg"
            >
              Hemen alisverise basla
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="absolute z-100 mx-auto h-56 w-full max-w-md sm:h-72 md:h-80"
          >
            <Image
              src="/products/grocery-bag.png"
              alt="Taze ürünlerle dolu market poseti"
              fill
              priority
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute w-full text-background">
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className=" w-full"
          >
            <path
              d="M0,0 
	      L1440,0 
	      L1440,0 
	      L1430,0 
	      Q720,50 10,0
	      L0,0 
		Z"
              fill="#065c4f"
            />
          </svg>
        </div>
      </div>
    </Section>
  );
}
