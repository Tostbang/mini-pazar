"use client";

import { useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IyzicoPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutFormHtml: string | null;
}

export function IyzicoPaymentModal({
  open,
  onOpenChange,
  checkoutFormHtml,
}: IyzicoPaymentModalProps) {
  useEffect(() => {
    if (checkoutFormHtml && open) {
      const iziycoScript = checkoutFormHtml.replace(
        /<script[^>]*>|<\/script>/gi,
        "",
      );

      const runScript = `
          ${iziycoScript}
          setTimeout(() => {
            iyziInit = undefined;
          }, 1001);
          `;

      const script = document.createElement("script");
      script.id = "iziyco-script" + Math.random().toString(36).substring(7);
      script.type = "text/javascript";
      script.innerHTML = runScript;
      document.body.appendChild(script);
    }
  }, [checkoutFormHtml, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            Güvenli Ödeme
          </DialogTitle>
          <DialogDescription>
            Iyzico altyapısı ile güvenli ödeme sayfasında işleminizi
            tamamlayın. Kart / banka havalesi / dijital cüzdan desteklenir.
          </DialogDescription>
        </DialogHeader>

        {checkoutFormHtml ? (
          <div
            id="iyzipay-checkout-form"
            className="min-h-[520px] rounded-xl border border-dashed border-border bg-muted/30 p-2"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Ödeme formu hazırlanıyor…
            </p>
            <p className="text-xs text-muted-foreground">
              Iyzico'ya yönlendiriliyorsunuz, lütfen bekleyin.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
