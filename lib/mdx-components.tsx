import Image from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";

const prose = "prose prose-neutral max-w-none dark:prose-invert";

function pickText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map(pickText).join(" ");
  }
  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    typeof (children as { props: { children?: React.ReactNode } }).props
      .children !== "undefined"
  ) {
    return pickText(
      (children as { props: { children?: React.ReactNode } }).props.children,
    );
  }
  return "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1
      id={slugify(pickText(children))}
      className="mt-10 scroll-mt-24 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      id={slugify(pickText(children))}
      className="mt-10 scroll-mt-24 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      id={slugify(pickText(children))}
      className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      id={slugify(pickText(children))}
      className="mt-6 scroll-mt-24 text-lg font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="mt-6 text-base font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p
      className="mt-4 text-base leading-relaxed text-foreground/90 first:mt-0"
      {...props}
    >
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => {
    const rawHref = typeof href === "string" ? href.trim() : "";

    // Geçersiz / placeholder href'leri bağlantı olarak render etme.
    // Yaygın MDX hataları: `[metin](#)`, `<a>metin</a>` (href'siz),
    // `[metin](javascript:void(0))`. Bunlar bağlantı gibi görünür ama
    // tıklandığında hiçbir şey yapmaz.
    const isPlaceholder =
      !rawHref ||
      rawHref === "#" ||
      rawHref.startsWith("javascript:") ||
      rawHref.startsWith("data:");

    if (isPlaceholder) {
      return (
        <span
          className="font-medium text-muted-foreground"
          data-missing-href
          title="Bağlantı adresi eksik — yönetici panelinden düzeltilmelidir."
          {...props}
        >
          {children}
        </span>
      );
    }

    const isExternal = /^https?:\/\//.test(rawHref);
    if (isExternal) {
      return (
        <a
          href={rawHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={rawHref}
        className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
        {...props}
      >
        {children}
      </Link>
    );
  },
  img: ({ src, alt, width, height, ...props }) => {
    const numericWidth =
      typeof width === "number" ? width : typeof width === "string" ? Number(width) : 1200;
    const numericHeight =
      typeof height === "number"
        ? height
        : typeof height === "string"
          ? Number(height)
          : 800;
    if (!src || typeof src !== "string") return null;
    return (
      <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={src}
          alt={alt ?? ""}
          width={Number.isFinite(numericWidth) ? numericWidth : 1200}
          height={Number.isFinite(numericHeight) ? numericHeight : 800}
          unoptimized
          className="h-auto w-full object-cover"
          {...props}
        />
        {alt ? (
          <figcaption className="border-t border-border bg-background px-4 py-2 text-center text-xs text-muted-foreground">
            {alt}
          </figcaption>
        ) : null}
      </figure>
    );
  },
  ul: ({ children, ...props }) => (
    <ul
      className="my-4 list-disc space-y-1.5 pl-6 text-foreground/90 marker:text-muted-foreground"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="my-4 list-decimal space-y-1.5 pl-6 text-foreground/90 marker:text-muted-foreground marker:font-medium"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-4 border-foreground/40 bg-muted/40 px-4 py-3 text-foreground/80 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => (
    <hr className="my-8 border-border" {...props} />
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/60 text-foreground" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border last:border-b-0" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2 text-foreground/90" {...props}>
      {children}
    </td>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-foreground/90" {...props}>
      {children}
    </em>
  ),
};

export const mdxProseClassName = prose;
