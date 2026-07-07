"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2 } from "lucide-react";
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
import type { Profile } from "@/lib/store/profile-store";

const formSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z
    .string()
    .trim()
    .min(2, "Soyad en az 2 karakter olmalıdır."),
  email: z.string().trim().pipe(z.email("Geçerli bir e-posta adresi giriniz.")),
  phone: z
    .string()
    .trim()
    .min(10, "Telefon numarası en az 10 karakter olmalıdır.")
    .regex(/^[0-9+\s()-]+$/, "Geçerli bir telefon numarası giriniz.")
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(240, "Adres en fazla 240 karakter olabilir."),
  city: z.string().trim().max(80, "Şehir en fazla 80 karakter olabilir."),
  postalCode: z
    .string()
    .trim()
    .max(20, "Posta kodu en fazla 20 karakter olabilir."),
  country: z
    .string()
    .trim()
    .max(80, "Ülke en fazla 80 karakter olabilir."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  onUpdated: () => Promise<void>;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onUpdated,
}: EditProfileModalProps) {
  const router = useRouter();
  const mutation = useMutationOP("put", "/api/User/UpdateProfile");

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    values: {
      firstName: toStringSafe(profile.firstName),
      lastName: toStringSafe(profile.lastName),
      email: toStringSafe(profile.email),
      phone: toStringSafe(profile.phone),
      address: toStringSafe(profile.address),
      city: toStringSafe(profile.city),
      postalCode: toStringSafe(profile.postalCode),
      country: toStringSafe(profile.country),
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await mutation.mutateAsync({
        body: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || null,
          address: data.address.trim() || null,
          city: data.city.trim() || null,
          postalCode: data.postalCode.trim() || null,
          country: data.country.trim() || null,
        },
      });
      await onUpdated();
      reset(data);
      toast.success("Profil bilgileri güncellendi.");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Profil güncellenemedi. Lütfen tekrar deneyin.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Profili Düzenle</DialogTitle>
          <DialogDescription>
            Profil bilgilerinizi güncelleyin
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
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
            placeholder="ornek@email.com"
            autoComplete="email"
          />
          <FormInput
            type="tel"
            name="phone"
            label="Telefon"
            control={control}
            placeholder="+90 555 000 00 00"
            autoComplete="tel"
          />
          <FormInput
            type="text"
            name="address"
            label="Adres"
            control={control}
            placeholder="Sokak, bina, daire no"
            autoComplete="street-address"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <FormInput
              type="text"
              name="country"
              label="Ülke"
              control={control}
              placeholder="Türkiye"
              autoComplete="country-name"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {mutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
