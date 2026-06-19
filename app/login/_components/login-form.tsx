"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  AuthFormFooter,
  AuthFormHeader,
} from "@/components/auth/auth-shell";
import { useLogin } from "../_services/mutations";

const formSchema = z.object({
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

type FormValues = z.infer<typeof formSchema>;

const inputClassName =
  "h-11 rounded-lg border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/30";

export function LoginForm() {
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const registered = searchParams.get("registered") === "1";
  const verified = searchParams.get("verified") === "1";
  const reset = searchParams.get("reset") === "1";

  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      email: emailFromQuery,
      password: "",
    },
  });

  useEffect(() => {
    setValue("email", emailFromQuery);
  }, [emailFromQuery, setValue]);

  useEffect(() => {
    if (registered) {
      toast.success("Kayıt başarılı. Şimdi giriş yapabilirsiniz.");
    }
  }, [registered]);

  useEffect(() => {
    if (verified) {
      toast.success("E-posta doğrulandı. Artık giriş yapabilirsiniz.");
    }
  }, [verified]);

  useEffect(() => {
    if (reset) {
      toast.success(
        "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.",
      );
    }
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    loginMutation.mutate({
      body: {
        email: data.email.trim(),
        password: data.password,
        isRemember: true,
      },
    });
  };

  return (
    <div>
      <AuthFormHeader
        icon={LogIn}
        title="Hesabınıza giriş yapın"
        description="Mağaza panelinize erişmek için bilgilerinizi girin."
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Şifre</span>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <FormInput
            type="password"
            name="password"
            control={control}
            autoComplete="current-password"
            placeholder="Şifrenizi girin"
            startIcon={<Lock />}
            className={inputClassName}
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            "Giriş Yap"
          )}
        </Button>
      </form>

      <AuthFormFooter
        message="Hesabınız yok mu?"
        linkLabel="Kayıt Ol"
        linkHref="/register"
      />
    </div>
  );
}
