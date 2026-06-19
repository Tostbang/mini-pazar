"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { motion } from "motion/react"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggle = () => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
      return next
    })
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Aydınlık moda geç" : "Karanlık moda geç"}
      className="relative grid size-10 place-items-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25 }}
      >
        {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </motion.span>
    </button>
  )
}
