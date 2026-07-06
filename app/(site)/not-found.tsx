import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-muted text-muted-foreground">
          <Search className="size-8" />
        </span>
        <div>
          <h1 className="font-heading text-4xl font-semibold text-brand">404</h1>
          <p className="mt-2 text-lg text-muted-foreground">Sayfa bulunamadı</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aradığınız sayfa mevcut değil veya taşınmış.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
        >
          <ArrowLeft className="size-4" />
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  )
}
