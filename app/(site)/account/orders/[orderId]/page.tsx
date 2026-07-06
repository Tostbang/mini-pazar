import { OrderDetail } from "./_components/order-detail";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { orderId: orderIdParam } = await params;
  const orderId = Number.parseInt(orderIdParam, 10);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <p className="font-heading text-lg font-semibold text-brand">
          Geçersiz sipariş numarası
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Lütfen sipariş listenizden geçerli bir sipariş seçin.
        </p>
      </div>
    );
  }

  return <OrderDetail orderId={orderId} />;
}