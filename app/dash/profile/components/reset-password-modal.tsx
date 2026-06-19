"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutationOP } from "@/lib/fetch";
import { toStringSafe } from "@/lib/helpers";
import { useProfileStore } from "@/lib/store/profile-store";

const requestSchema = z.object({
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
});

const resetSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Lütfen 6 haneli doğrulama kodunu girin."),
    newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
    confirmNewPassword: z
      .string()
      .min(6, "Şifre tekrar alanı zorunludur."),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmNewPassword"],
  });

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const DEFAULT_RESEND_SECONDS = 60;

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "request" | "verify";

export function ResetPasswordModal({
  open,
  onOpenChange,
}: ResetPasswordModalProps) {
  const profile = useProfileStore((state) => state.profile);
  const userEmail = toStringSafe(profile?.email);
  const [step, setStep] = useState<Step>("request");
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_RESEND_SECONDS,
  );

  const forgotMutation = useMutationOP("post", "/api/Auth/ForgotPassword");
  const resetMutation = useMutationOP("post", "/api/Auth/ResetPassword");

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema as never) as Resolver<RequestValues>,
    values: { email: userEmail },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema as never) as Resolver<ResetValues>,
    defaultValues: {
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    requestForm.reset({ email: userEmail });
  }, [userEmail, requestForm]);

  useEffect(() => {
    if (!open) {
      setStep("request");
      setRemainingSeconds(DEFAULT_RESEND_SECONDS);
      requestForm.reset({ email: userEmail });
      resetForm.reset({
        code: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [open, userEmail, requestForm, resetForm]);

  useEffect(() => {
    if (step !== "verify" || remainingSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [step, remainingSeconds]);

  const onRequestCode = async (data: RequestValues) => {
    try {
      await forgotMutation.mutateAsync({ body: { email: data.email.trim() } });
      toast.success("Sıfırlama kodu e-posta adresinize gönderildi.");
      setStep("verify");
      setRemainingSeconds(DEFAULT_RESEND_SECONDS);
    } catch {
      toast.error("Kod gönderilirken bir hata oluştu.");
    }
  };

  const onVerifyAndReset = async (data: ResetValues) => {
    if (!userEmail) {
      toast.error("Profil bilgisi bulunamadı.");
      return;
    }
    try {
      await resetMutation.mutateAsync({
        body: {
          email: userEmail,
          code: data.code.trim(),
          newPassword: data.newPassword,
        },
      });
      toast.success("Şifreniz başarıyla güncellendi.");
      onOpenChange(false);
    } catch {
      toast.error("Şifre güncellenemedi. Kodu ve şifreyi kontrol edin.");
    }
  };

  const onResendCode = async () => {
    if (!userEmail) return;
    try {
      const response = await forgotMutation.mutateAsync({
        body: { email: userEmail },
      });
      const nextTimer =
        typeof response.remainingSeconds === "number" &&
        response.remainingSeconds > 0
          ? response.remainingSeconds
          : DEFAULT_RESEND_SECONDS;
      setRemainingSeconds(nextTimer);
      resetForm.reset({ code: "", newPassword: "", confirmNewPassword: "" });
      toast.success(
        response.message || "Doğrulama kodu yeniden gönderildi.",
      );
    } catch {
      toast.error("Kod yeniden gönderilirken bir hata oluştu.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-brand text-brand-foreground">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle>Şifreyi Sıfırla</DialogTitle>
              <DialogDescription>
                E-postanıza gelen kod ile yeni şifrenizi belirleyin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "request" ? (
          <form
            onSubmit={requestForm.handleSubmit(onRequestCode)}
            className="flex flex-col gap-3"
          >
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                <span>
                  Kod, hesabınıza kayıtlı e-posta adresine gönderilecek:
                </span>
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {userEmail || "E-posta adresi bulunamadı"}
              </p>
            </div>

            <FormInput
              type="email"
              name="email"
              label="E-posta"
              control={requestForm.control}
              autoComplete="email"
              placeholder="ornek@eposta.com"
              disabled={!userEmail}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={forgotMutation.isPending}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={forgotMutation.isPending || !userEmail}
              >
                {forgotMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                {forgotMutation.isPending ? "Gönderiliyor..." : "Kod Gönder"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            onSubmit={resetForm.handleSubmit(onVerifyAndReset)}
            className="flex flex-col gap-3"
          >
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">
                  {userEmail}
                </span>{" "}
                adresine gönderilen 6 haneli kodu girin.
              </p>
            </div>

            <FormInput
              type="text"
              name="code"
              label="Doğrulama Kodu"
              control={resetForm.control}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              className="text-center text-lg tracking-[0.5em]"
            />

            <FormInput
              type="password"
              name="newPassword"
              label="Yeni Şifre"
              control={resetForm.control}
              autoComplete="new-password"
              placeholder="Yeni şifrenizi girin"
            />

            <FormInput
              type="password"
              name="confirmNewPassword"
              label="Yeni Şifre (Tekrar)"
              control={resetForm.control}
              autoComplete="new-password"
              placeholder="Yeni şifrenizi tekrar girin"
            />

            <div className="rounded-xl border border-border bg-muted/50 p-3 text-center text-xs text-muted-foreground">
              {remainingSeconds > 0
                ? `Yeni kod için ${remainingSeconds} saniye bekleyin.`
                : "Kod gelmediyse tekrar gönderebilirsiniz."}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onResendCode}
              className="h-11 w-full"
              disabled={
                remainingSeconds > 0 || forgotMutation.isPending || !userEmail
              }
            >
              {forgotMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {forgotMutation.isPending
                ? "Gönderiliyor..."
                : "Kodu Tekrar Gönder"}
            </Button>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={resetMutation.isPending}
              >
                İptal
              </Button>
              <Button type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                {resetMutation.isPending
                  ? "Güncelleniyor..."
                  : "Şifreyi Güncelle"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
