"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  AuthFormFooter,
  AuthFormHeader,
} from "@/components/auth/auth-shell";
import { useResetPassword } from "../_services/mutations";

const formSchema = z
  .object({
    email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
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

type FormValues = z.infer<typeof formSchema>;

const inputClassName =
  "h-11 rounded-lg border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/30";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPasswordMutation = useResetPassword();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const sent = searchParams.get("sent") === "1";

  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      email: emailFromQuery,
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    setValue("email", emailFromQuery);
  }, [emailFromQuery, setValue]);

  useEffect(() => {
    if (sent) {
      toast.success("Sıfırlama kodu e-posta adresinize gönderildi.");
    }
  }, [sent]);

  const onSubmit = async (data: FormValues) => {
    const email = data.email.trim();
    try {
      await resetPasswordMutation.mutateAsync({
        body: {
          email,
          code: data.code.trim(),
          newPassword: data.newPassword,
        },
      });
      router.push(`/login?reset=1&email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Şifre sıfırlanırken bir hata oluştu.");
      }
    }
  };

  return (
    <div>
      <AuthFormHeader
        icon={ShieldCheck}
        title="Yeni şifre belirleyin"
        description="E-postanıza gelen kodu ve yeni şifrenizi girin."
      />

      <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          type="email"
          name="email"
          label="E-posta"
          control={control}
          autoComplete="email"
          placeholder="ornek@eposta.com"
          startIcon={<Mail />}
          className={inputClassName}
        />

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
        />

        <FormInput
          type="password"
          name="newPassword"
          label="Yeni Şifre"
          control={control}
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          startIcon={<Lock />}
          className={inputClassName}
        />

        <FormInput
          type="password"
          name="confirmNewPassword"
          label="Yeni Şifre Tekrar"
          control={control}
          autoComplete="new-password"
          placeholder="Yeni şifrenizi tekrar girin"
          startIcon={<Lock />}
          className={inputClassName}
        />

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Şifre güncelleniyor...
            </>
          ) : (
            "Şifreyi Güncelle"
          )}
        </Button>
      </form>

      <AuthFormFooter
        message="Kod gelmedi mi?"
        linkLabel="Yeniden Gönder"
        linkHref="/forgot-password"
      />
    </div>
  );
}
