"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  AuthFormFooter,
  AuthFormHeader,
} from "@/components/auth/auth-shell";
import { useRegister } from "../_services/mutations";

// Ad / soyad: yalnızca harf (Türkçe karakterler dahil), tire ve boşluk.
// Rakam ve özel karakter kabul edilmez. Unicode letter sınıfı Türkçe
// harfleri ve gelecekteki karakterleri doğru yakalar.
const namePattern = /^[\p{L}][\p{L}\s'-]*$/u;

const formSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Ad en az 2 karakter olmalıdır.")
      .max(80, "Ad en fazla 80 karakter olabilir.")
      .regex(
        namePattern,
        "Ad yalnızca harf içerebilir; rakam ve özel karakter kullanılamaz.",
      ),
    lastName: z
      .string()
      .trim()
      .min(2, "Soyad en az 2 karakter olmalıdır.")
      .max(80, "Soyad en fazla 80 karakter olabilir.")
      .regex(
        namePattern,
        "Soyad yalnızca harf içerebilir; rakam ve özel karakter kullanılamaz.",
      ),
    email: z.email("Lütfen geçerli bir e-posta adresi girin."),
    phone: z
      .string()
      .trim()
      .min(1, "Telefon numarası zorunludur.")
      .max(20, "Telefon numarası en fazla 20 karakter olabilir.")
      .regex(
        /^[0-9+\s()-]+$/,
        "Telefon numarası yalnızca rakam, +, -, (, ) ve boşluk içerebilir.",
      )
      .refine(
        (value) => {
          // Biçim karakterlerini at; yalnızca rakam sayısı 10-15 aralığında
          // olmalı (TR 10 hane + uluslararası ek ülke kodu).
          const digits = value.replace(/\D/g, "");
          return digits.length >= 10 && digits.length <= 15;
        },
        "Telefon numarası 10 ile 15 hane arasında olmalıdır.",
      ),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
    confirmPassword: z.string().min(6, "Şifre tekrar alanı zorunludur."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

const inputClassName =
  "h-11 rounded-lg border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/30";

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await registerMutation.mutateAsync({
        body: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          password: data.password,
        },
      });
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email.trim())}`,
      );
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Kayıt yapılırken bir hata oluştu.");
      }
    }
  };

  return (
    <div>
      <AuthFormHeader
        icon={UserPlus}
        title="Hesap oluşturun"
        description="Mağaza panelinize erişmek için hesabınızı oluşturun."
      />

      <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            type="text"
            name="firstName"
            label="Ad"
            control={control}
            autoComplete="given-name"
            placeholder="Adınız"
            startIcon={<User />}
            className={inputClassName}
          />
          <FormInput
            type="text"
            name="lastName"
            label="Soyad"
            control={control}
            autoComplete="family-name"
            placeholder="Soyadınız"
            startIcon={<User />}
            className={inputClassName}
          />
        </div>

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
          type="tel"
          name="phone"
          label="Telefon"
          control={control}
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="+90 555 000 00 00"
          startIcon={<Phone />}
          className={inputClassName}
        />

        <FormInput
          type="password"
          name="password"
          label="Şifre"
          control={control}
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          startIcon={<Lock />}
          className={inputClassName}
        />

        <FormInput
          type="password"
          name="confirmPassword"
          label="Şifre Tekrar"
          control={control}
          autoComplete="new-password"
          placeholder="Şifrenizi tekrar girin"
          startIcon={<Lock />}
          className={inputClassName}
        />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Kayıt olarak{" "}
          <span className="font-medium text-foreground">Kullanım Şartları</span>{" "}
          ve{" "}
          <span className="font-medium text-foreground">
            Gizlilik Politikası
          </span>
          'nı kabul etmiş olursunuz.
        </p>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Kayıt yapılıyor...
            </>
          ) : (
            "Hesap Oluştur"
          )}
        </Button>
      </form>

      <AuthFormFooter
        message="Zaten hesabınız var mı?"
        linkLabel="Giriş Yap"
        linkHref="/login"
      />
    </div>
  );
}
