import { Badge } from "@/components/ui/badge";
import { getOrderStatusLabel } from "@/lib/types/enums";
import { getOrderStatusVariant } from "../_services/status";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: number | undefined | null;
  className?: string;
}) {
  return (
    <Badge variant={getOrderStatusVariant(status)} className={className}>
      {getOrderStatusLabel(status)}
    </Badge>
  );
}
