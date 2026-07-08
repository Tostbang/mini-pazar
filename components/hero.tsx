"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Section } from "@/components/section";
import { useGetHomeCards } from "@/lib/home-cards";
import { resolveImageUrl } from "@/lib/image-url";
import { useSiteSettingsStore } from "@/lib/store/site-settings-store";

const FALLBACK_HEADING = "Marketi ayağiniza getiriyoruz";
const FALLBACK_DESCRIPTION =
  "Organik ürünler ve sürdürülebilir kaynakli\nmarket teslimati, %4'e varan indirimle.";
const FALLBACK_BUTTON = "Şimdi incele";
const FALLBACK_IMAGE = "/products/grocery-bag.png";

export function Hero() {
  // Same hydration-safe pattern used by CategoryPills: server has no
  // persisted cache, so a straight isLoading branch would render the
  // skeleton on the server and populated data on the client → React
  // throws a hydration mismatch. Defer until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tagline =
    useSiteSettingsStore((state) => state.settings?.siteTagline?.trim()) ||
    FALLBACK_HEADING;

  const query = useGetHomeCards();
  const mainCard = mounted ? query.data?.mainCard : undefined;
  const enabled = mainCard?.enabled ?? true;

  // Hide the section entirely when the shop owner disabled it from the
  // dashboard. Falls back to the tagline-driven static hero when the API
  // returned nothing (cold database) or the section is disabled.
  if (!enabled) return null;

  const title = (mainCard?.title?.trim() || tagline) ?? FALLBACK_HEADING;
  const description =
    mainCard?.description?.trim() || FALLBACK_DESCRIPTION;
  const buttonName = mainCard?.buttonName?.trim() || FALLBACK_BUTTON;
  const imageUrl = resolveImageUrl(mainCard?.imageUrl) ?? FALLBACK_IMAGE;

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
              <h1 className="whitespace-pre-line text-4xl text-[#f9efde] font-intro font-semibold leading-[1.05] text-balance sm:text-5xl lg:text-[3.65rem] ">
                {title}
              </h1>
              <p className="mt-4 max-w-md whitespace-pre-line text-lg text-pretty leading-relaxed text-brand-foreground/80">
                {description}
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="mt-7 rounded-lg bg-secondary px-9 py-3.5 font-heading text-lg font-semibold text-brand"
              >
                {buttonName}
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative mx-auto h-56 w-full max-w-md sm:h-72 md:h-90 top-11"
            >
              <Image
                src={imageUrl}
                alt={title || "Mağaza görseli"}
                fill
                priority
                unoptimized={imageUrl.startsWith("http")}
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