"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetMyAddress,
  useUpdateMyAddress,
  type AccountAddress,
} from "../_services/queries";

const formSchema = z
  .object({
    address: z
      .string()
      .trim()
      .max(240, "Adres en fazla 240 karakter olabilir."),
    city: z
      .string()
      .trim()
      .max(80, "Şehir en fazla 80 karakter olabilir."),
    postalCode: z
      .string()
      .trim()
      .max(20, "Posta kodu en fazla 20 karakter olabilir."),
    country: z
      .string()
      .trim()
      .max(80, "Ülke en fazla 80 karakter olabilir."),
  })
  // Backend kuralı: address alanı doluysa city ve country zorunlu olur.
  // Boş bırakılan tek alanlı kullanım (yalnızca ülke gibi) için bu kural
  // uygulanmaz — bu yüzden superRefine ile koşullu doğrulama yapıyoruz.
  .superRefine((value, ctx) => {
    const hasAddress = value.address.trim().length > 0;
    if (!hasAddress) return;

    if (value.city.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Adres girdiğinizde şehir zorunludur.",
      });
    }
    if (value.country.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Adres girdiğinizde ülke zorunludur.",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const EMPTY_ADDRESS: AccountAddress = {
  address: null,
  city: null,
  postalCode: null,
  country: null,
};

function buildDefaults(address: AccountAddress | null | undefined): FormValues {
  return {
    address: address?.address ?? "",
    city: address?.city ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "",
  };
}

function toPayload(values: FormValues) {
  return {
    address: values.address.trim() || null,
    city: values.city.trim() || null,
    postalCode: values.postalCode.trim() || null,
    country: values.country.trim() || null,
  };
}

export function AddressForm() {
  const addressQuery = useGetMyAddress();
  const updateMutation = useUpdateMyAddress();

  const current = addressQuery.data?.address ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: buildDefaults(current ?? undefined),
  });

  // Server'dan gelen adres her değiştiğinde formu senkronize et.
  useEffect(() => {
    if (addressQuery.data) {
      reset(buildDefaults(addressQuery.data.address));
    }
  }, [addressQuery.data, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({ body: toPayload(values) });
      reset(buildDefaults(toPayload(values)));
      toast.success("Adres bilgileriniz güncellendi.");
    } catch {
      toast.error("Adres güncellenemedi. Lütfen tekrar deneyin.");
    }
  };

  const onClear = () => {
    reset(buildDefaults(EMPTY_ADDRESS));
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
          <MapPin className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-brand sm:text-3xl">
            Adres Bilgilerim
          </h1>
          <p className="text-sm text-muted-foreground">
            Siparişleriniz için kullanılacak adres bilgilerini buradan
            güncelleyebilirsiniz.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {addressQuery.isLoading ? (
          <AddressFormSkeleton />
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    Açık adres
                  </span>
                  <textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                    placeholder="Sokak, bina, daire no, mahalle"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                  />
                  <span className="text-xs text-muted-foreground">
                    Adres girerseniz şehir ve ülke alanları zorunlu olur.
                  </span>
                  {fieldState.invalid &&
                    typeof fieldState.error?.message === "string" && (
                      <p
                        className="text-xs font-medium text-destructive"
                        role="alert"
                      >
                        {fieldState.error.message}
                      </p>
                    )}
                </div>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                type="text"
                name="city"
                label="Şehir"
                control={control}
                placeholder="İstanbul"
                autoComplete="address-level2"
              />
              <FormInput
                type="text"
                name="postalCode"
                label="Posta kodu"
                control={control}
                placeholder="34000"
                autoComplete="postal-code"
              />
            </div>

            <FormInput
              type="text"
              name="country"
              label="Ülke"
              control={control}
              placeholder="Türkiye"
              autoComplete="country-name"
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
                  onClick={onClear}
                  disabled={updateMutation.isPending}
                >
                  <Trash2 className="size-4" />
                  Temizle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset(buildDefaults(current ?? undefined))}
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

function AddressFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}