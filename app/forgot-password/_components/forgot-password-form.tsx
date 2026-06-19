"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  AuthFormFooter,
  AuthFormHeader,
} from "@/components/auth/auth-shell";
import { useForgotPassword } from "../_services/mutations";

const formSchema = z.object({
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
});

type FormValues = z.infer<typeof formSchema>;

const inputClassName =
  "h-11 rounded-lg border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/30";

export function ForgotPasswordForm() {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    const email = data.email.trim();
    try {
      await forgotPasswordMutation.mutateAsync({
        body: { email },
      });
      router.push(`/reset-password?email=${encodeURIComponent(email)}&sent=1`);
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Kod gönderilirken bir hata oluştu.");
      }
    }
  };

  return (
    <div>
      <AuthFormHeader
        icon={KeyRound}
        title="Şifrenizi sıfırlayın"
        description="E-posta adresinizi girin, size tek kullanımlık bir doğrulama kodu gönderelim."
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
          hint="Kayıt olurken kullandığınız e-postayı girin."
        />

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Kod gönderiliyor...
            </>
          ) : (
            "Sıfırlama Kodu Gönder"
          )}
        </Button>
      </form>

      <AuthFormFooter
        message="Şifrenizi hatırladınız mı?"
        linkLabel="Giriş Yap"
        linkHref="/login"
      />
    </div>
  );
}
