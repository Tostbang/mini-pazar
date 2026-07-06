import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * shadcn uyumlu, kontrollü (controlled) sayfalama bileşenleri.
 *
 * Tüm alt bileşenler bağımsız (prop-driven) çalışır — tek bir root
 * bileşeninin içinde olma zorunluluğu yoktur. Aktif sayfa değişimi
 * `onPageChange` üzerinden dışarıya bildirilir; filtreleme/arama
 * değiştiğinde dış state sıfırlanabilir.
 *
 * Örnek kullanım:
 *   <PaginationInfo page={page} totalPages={total} totalItems={n} pageSize={10} />
 *   <PaginationPrevious page={page} onPageChange={setPage} />
 *   <Pagination page={page} totalPages={total} onPageChange={setPage} />
 *   <PaginationNext page={page} totalPages={total} onPageChange={setPage} />
 */

type ButtonProps = React.ComponentProps<typeof Button>;

interface PaginationCommonProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

function buildPageRange(current: number, total: number, siblings: number) {
  const safeTotal = Math.max(1, total);
  // En küçük durum: tüm sayfalar sığıyorsa direkt listele.
  const totalSlots = siblings * 2 + 5; // ilk + son + aktif + 2 ellipsis + siblings
  if (safeTotal <= totalSlots) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, safeTotal);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < safeTotal - 1;

  const first = 1;
  const last = safeTotal;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from(
      { length: 3 + siblings * 2 },
      (_, index) => index + 1,
    );
    return [...leftRange, "ellipsis-end", last];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + siblings * 2 },
      (_, index) => safeTotal - (3 + siblings * 2) + index + 1,
    );
    return [first, "ellipsis-start", ...rightRange];
  }

  const middle = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, index) => leftSibling + index,
  );
  return [
    first,
    "ellipsis-start",
    ...middle,
    "ellipsis-end",
    last,
  ];
}

interface PaginationProps extends PaginationCommonProps {
  /** Aktif sayfanın her iki yanında kaç komşu sayfa bağlantısı gösterileceği. */
  siblingCount?: number;
  className?: string;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const safePage = clampPage(page, totalPages);
  const safeTotal = Math.max(1, totalPages);
  const goTo = (next: number) => onPageChange(clampPage(next, safeTotal));
  const items = buildPageRange(safePage, safeTotal, siblingCount);

  return (
    <nav
      role="navigation"
      aria-label="Sayfalama"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <ul className="flex flex-row items-center gap-1">
        {items.map((item, index) => {
          if (typeof item === "string") {
            return (
              <li
                key={`${item}-${index}`}
                data-slot="pagination-ellipsis"
                aria-hidden
                className="grid size-9 place-items-center text-muted-foreground"
              >
                <MoreHorizontalIcon className="size-4" />
              </li>
            );
          }
          const isActive = item === safePage;
          return (
            <li key={item} data-slot="pagination-item">
              <PaginationLink
                page={item}
                isActive={isActive}
                onPageChange={onPageChange}
                totalPages={totalPages}
              >
                {item}
              </PaginationLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface PaginationLinkProps
  extends Omit<ButtonProps, "children" | "render">,
    PaginationCommonProps {
  page: number;
  isActive?: boolean;
  children?: React.ReactNode;
}

function PaginationLink({
  page,
  isActive = false,
  className,
  children,
  onPageChange,
  totalPages,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      size="icon-sm"
      aria-current={isActive ? "page" : undefined}
      aria-label={`Sayfa ${page}`}
      onClick={() => onPageChange(clampPage(page, totalPages))}
      className={cn("tabular-nums", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

interface PaginationPreviousProps
  extends Omit<ButtonProps, "render" | "onClick">,
    PaginationCommonProps {}

function PaginationPrevious({
  page,
  totalPages,
  onPageChange,
  className,
  ...props
}: PaginationPreviousProps) {
  const safePage = clampPage(page, totalPages);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Önceki sayfa"
      onClick={() => onPageChange(clampPage(safePage - 1, totalPages))}
      disabled={safePage <= 1}
      className={cn("gap-1 px-3", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span>Önceki</span>
    </Button>
  );
}

interface PaginationNextProps
  extends Omit<ButtonProps, "render" | "onClick">,
    PaginationCommonProps {}

function PaginationNext({
  page,
  totalPages,
  onPageChange,
  className,
  ...props
}: PaginationNextProps) {
  const safePage = clampPage(page, totalPages);
  const safeTotal = Math.max(1, totalPages);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Sonraki sayfa"
      onClick={() => onPageChange(clampPage(safePage + 1, totalPages))}
      disabled={safePage >= safeTotal}
      className={cn("gap-1 px-3", className)}
      {...props}
    >
      <span>Sonraki</span>
      <ChevronRightIcon className="size-4" />
    </Button>
  );
}

interface PaginationInfoProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  className?: string;
}

function PaginationInfo({
  page,
  totalPages,
  totalItems,
  pageSize,
  className,
}: PaginationInfoProps) {
  const safePage = clampPage(page, totalPages);
  const safeTotal = Math.max(1, totalPages);
  const first = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const last = Math.min(safePage * pageSize, totalItems);
  return (
    <p
      data-slot="pagination-info"
      className={cn("text-xs text-muted-foreground tabular-nums", className)}
    >
      {totalItems === 0
        ? "0 sonuç"
        : `${first}–${last} / ${totalItems} · Sayfa ${safePage} / ${safeTotal}`}
    </p>
  );
}

export {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationInfo,
};
