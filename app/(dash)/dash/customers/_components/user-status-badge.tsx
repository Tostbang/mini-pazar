import { Badge } from "@/components/ui/badge";

/**
 * Backend yalnızca boolean status üretiyor; UI katmanında anlamlı
 * etiketlere çevirir. Soft-delete edilmiş kullanıcılar (status=false)
 * "Pasif" olarak işaretlenir.
 */
export function UserStatusBadge({
  status,
  className,
}: {
  status: boolean | undefined | null;
  className?: string;
}) {
  const isActive = status === true;
  return (
    <Badge
      variant={isActive ? "secondary" : "destructive"}
      className={className}
    >
      {isActive ? "Aktif" : "Pasif"}
    </Badge>
  );
}