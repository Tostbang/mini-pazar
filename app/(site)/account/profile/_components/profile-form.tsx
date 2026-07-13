"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  RotateCcw,
  Save,
  ShieldAlert,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toErrorMessage } from "@/lib/helpers";
import {
  useGetMyProfile,
  useUpdateProfile,
  type UserProfile,
} from "../_services/queries";

const formSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Ad zorunludur.")
    .max(80, "Ad en fazla 80 karakter olabilir."),
  lastName: z
    .string()
    .trim()
    .min(1, "Soyad zorunludur.")
    .max(80, "Soyad en fazla 80 karakter olabilir."),
  email: z
    .string()
    .trim()
    .min(1, "E-posta zorunludur.")
    .pipe(z.email("Geçerli bir e-posta adresi girin.")),
  phone: z
    .string()
    .trim()
    .max(20, "Telefon en fazla 20 karakter olabilir."),
});

type FormValues = z.infer<typeof formSchema>;

function buildDefaults(user: UserProfile | null | undefined): FormValues {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };
}

export function ProfileForm() {
  const profileQuery = useGetMyProfile();
  const updateMutation = useUpdateProfile();

  const user = profileQuery.data?.user ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: buildDefaults(user),
  });

  // Server'dan gelen profil her değiştiğinde formu senkronize et.
  useEffect(() => {
    if (profileQuery.data?.user) {
      reset(buildDefaults(profileQuery.data.user));
    }
  }, [profileQuery.data, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Adres alanları ayrı bir sayfadan (/account/address) yönetiliyor.
      // UpdateProfile adresi de gönderdiği için mevcut adresi olduğu gibi
      // geri gönderiyoruz — aksi halde profil kaydı adresi sıfırlardı.
      await updateMutation.mutateAsync({
        body: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || null,
          address: user?.address ?? null,
          city: user?.city ?? null,
          postalCode: user?.postalCode ?? null,
          country: user?.country ?? null,
        },
      });
      toast.success("Profil bilgileriniz güncellendi.");
    } catch (error) {
      toast.error(
        toErrorMessage(
          error,
          "Profil güncellenemedi. Lütfen tekrar deneyin.",
        ),
      );
    }
  };

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
      >
        <ArrowLeft className="size-4" />
        Hesabıma dön
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-muted text-brand">
          <User className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-brand sm:text-3xl">
            Profilim
          </h1>
          <p className="text-sm text-muted-foreground">
            Kişisel bilgilerinizi buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      {user && (
        <div className="mt-4">
          {user.emailConfirmed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <BadgeCheck className="size-3.5" />
              E-posta doğrulandı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
              <ShieldAlert className="size-3.5" />
              E-posta doğrulanmadı
            </span>
          )}
        </div>
      )}

      <div className="mt-8">
        {profileQuery.isLoading ? (
          <ProfileFormSkeleton />
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                type="text"
                name="firstName"
                label="Ad"
                control={control}
                placeholder="Adınız"
                autoComplete="given-name"
              />
              <FormInput
                type="text"
                name="lastName"
                label="Soyad"
                control={control}
                placeholder="Soyadınız"
                autoComplete="family-name"
              />
            </div>

            <FormInput
              type="email"
              name="email"
              label="E-posta"
              control={control}
              placeholder="ornek@eposta.com"
              autoComplete="email"
            />

            <FormInput
              type="tel"
              name="phone"
              label="Telefon"
              control={control}
              placeholder="05xx xxx xx xx"
              autoComplete="tel"
            />

            <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {isDirty
                  ? "Kaydedilmemiş değişiklikleriniz var."
                  : "Tüm değişiklikler kaydedildi."}
              </span>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset(buildDefaults(user))}
                  disabled={!isDirty || updateMutation.isPending}
                >
                  <RotateCcw className="size-4" />
                  Geri al
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
