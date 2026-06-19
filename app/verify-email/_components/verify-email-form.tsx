"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  AuthFormFooter,
  AuthFormHeader,
} from "@/components/auth/auth-shell";
import {
  useResendVerificationCode,
  useVerifyEmail,
} from "../_services/mutations";

const DEFAULT_RESEND_SECONDS = 60;

const formSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Lütfen 6 haneli doğrulama kodunu girin."),
});

type FormValues = z.infer<typeof formSchema>;

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyEmailMutation = useVerifyEmail();
  const resendCodeMutation = useResendVerificationCode();
  const email = searchParams.get("email")?.trim() ?? "";
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_RESEND_SECONDS,
  );

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [remainingSeconds]);

  const onSubmit = async (data: FormValues) => {
    if (!email) {
      toast.error("Doğrulama için e-posta bilgisi bulunamadı.");
      return;
    }

    try {
      await verifyEmailMutation.mutateAsync({
        body: {
          email,
          code: data.code.trim(),
        },
      });
      router.push(`/login?verified=1&email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("E-posta doğrulaması sırasında bir hata oluştu.");
      }
    }
  };

  const onResendCode = async () => {
    if (!email) {
      toast.error("Kod göndermek için e-posta bilgisi bulunamadı.");
      return;
    }

    try {
      const response = await resendCodeMutation.mutateAsync({
        body: { email },
      });
      const nextTimer =
        typeof response.remainingSeconds === "number" &&
        response.remainingSeconds > 0
          ? response.remainingSeconds
          : DEFAULT_RESEND_SECONDS;
      setRemainingSeconds(nextTimer);
      reset({ code: "" });
      toast.success(
        response.message || "Doğrulama kodu yeniden gönderildi.",
      );
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Kod yeniden gönderilirken bir hata oluştu.");
      }
    }
  };

  return (
    <div>
      <AuthFormHeader
        icon={Mail}
        title="E-postanızı doğrulayın"
        description={
          email ? (
            <>
              <span className="font-medium text-foreground">{email}</span>{" "}
              adresine gönderdiğimiz 6 haneli kodu girin.
            </>
          ) : (
            "Doğrulama için e-posta bilgisi eksik. Lütfen kayıt sayfasına dönün."
          )
        }
      />

      <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          type="text"
          name="code"
          label="Doğrulama Kodu"
          control={control}
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="6 haneli kod"
          className="h-12 rounded-lg border-border bg-background px-3 text-center text-lg font-semibold tracking-[0.5em] placeholder:text-muted-foreground/40 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal focus-visible:border-ring focus-visible:ring-ring/30"
          disabled={verifyEmailMutation.isPending || !email}
        />

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold"
          disabled={verifyEmailMutation.isPending || !email}
        >
          {verifyEmailMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Doğrulanıyor...
            </>
          ) : (
            "E-postayı Doğrula"
          )}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-muted-foreground">
          {remainingSeconds > 0 ? (
            <>
              Yeni kod gönderebilmek için{" "}
              <span className="font-medium text-foreground">
                {remainingSeconds}s
              </span>{" "}
              bekleyin.
            </>
          ) : (
            "Kod gelmediyse tekrar gönderebilirsiniz."
          )}
        </p>

        <Button
          type="button"
          variant="ghost"
          onClick={onResendCode}
          className="h-9 rounded-lg px-3 text-sm font-medium text-foreground"
          disabled={
            remainingSeconds > 0 || resendCodeMutation.isPending || !email
          }
        >
          {resendCodeMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Kod gönderiliyor...
            </>
          ) : (
            <>
              <RefreshCcw className="size-3.5" />
              Kodu Tekrar Gönder
            </>
          )}
        </Button>
      </div>

      <AuthFormFooter
        message="Doğrulama tamamlandı mı?"
        linkLabel="Giriş Yap"
        linkHref="/login"
      />
    </div>
  );
}
