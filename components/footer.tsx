import Link from "next/link"
import { ShoppingBasket } from "lucide-react"

const cols = [
  {
    title: "Şirket",
    links: [
      { label: "Hakkımızda", href: "/about" },
      { label: "Kariyer", href: "#" },
      { label: "Basın", href: "#" },
      { label: "Yorumlar", href: "#" },
    ],
  },
  {
    title: "Alışveriş",
    links: [
      { label: "Sebze", href: "#" },
      { label: "Meyve", href: "#" },
      { label: "Et & Balık", href: "#" },
      { label: "Dondurulmuş gıda", href: "#" },
    ],
  },
  {
    title: "Destek",
    links: [
      { label: "Yardım merkezi", href: "#" },
      { label: "Sipariş takibi", href: "#" },
      { label: "İadeler", href: "#" },
      { label: "İletişim", href: "#" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik politikası", href: "#" },
      { label: "Koşullar", href: "#" },
      { label: "Çerezler", href: "#" },
      { label: "Lisanslar", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className=" px-4 pb-10 pt-6 sm:px-6">
      <div className="rounded-[2rem] bg-brand px-6 py-12 text-brand-foreground sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-lime text-lime-foreground">
                <ShoppingBasket className="size-5" />
              </span>
              <span className="font-heading text-2xl font-semibold">Gromuse</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-foreground/70">
              Tazeliği hemen yaşayın. Organik ürünler ve sürdürülebilir kaynaklı market alışverişiniz kapınıza gelsin.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading text-base font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-brand-foreground/70 transition-colors hover:text-lime"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-brand-foreground/60">
          © {new Date().getFullYear()} Gromuse. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  )
}
