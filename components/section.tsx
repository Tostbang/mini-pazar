import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("px-4 py-6 sm:px-6", className)} {...props} />
}
