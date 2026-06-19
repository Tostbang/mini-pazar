import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

export interface AuthFormHeaderProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
}

export function AuthFormHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: AuthFormHeaderProps) {
  return (
    <header className="flex flex-col items-center text-center">
      {Icon && (
        <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted/60 text-foreground">
          <Icon className="size-5" />
        </span>
      )}
      {eyebrow && (
        <span className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h1
        className={cn(
          "font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]",
          Icon || eyebrow ? "mt-2" : "",
        )}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

export interface AuthFormFooterProps {
  message: string;
  linkLabel: string;
  linkHref: string;
}

export function AuthFormFooter({
  message,
  linkLabel,
  linkHref,
}: AuthFormFooterProps) {
  return (
    <p className="mt-8 text-center text-sm text-muted-foreground">
      {message}{" "}
      <Link
        href={linkHref}
        className="font-semibold text-foreground underline-offset-4 transition-colors hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}

export interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative flex min-h-[calc(100vh-80px)] flex-col bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:px-6 sm:pt-0">
          <div className="w-full max-w-md">
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              {children}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}