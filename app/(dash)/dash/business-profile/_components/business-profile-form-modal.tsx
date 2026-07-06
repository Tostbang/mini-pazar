"use client";

import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Save,
  Store as StoreIcon,
  Phone,
  MapPin,
  FileText,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toStringSafe } from "@/lib/helpers";
import {
  useCreateOrUpdateBusinessProfile,
  type BusinessProfile,
} from "../_services/queries";

const profileSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, "Mağaza adı en az 2 karakter olmalıdır.")
    .max(120, "Mağaza adı en fazla 120 karakter olabilir."),
  businessType: z
    .string()
    .trim()
    .min(2, "Sektör en az 2 karakter olmalıdır.")
    .max(80, "Sektör en fazla 80 karakter olabilir."),
  address: z
    .string()
    .trim()
    .min(5, "Adres en az 5 karakter olmalıdır.")
    .max(250, "Adres en fazla 250 karakter olabilir."),
  phone: z
    .string()
    .trim()
    .min(10, "Telefon numarası en az 10 karakter olmalıdır.")
    .max(40, "Telefon numarası en fazla 40 karakter olabilir.")
    .regex(/^[0-9+\s()-]+$/, "Geçerli bir telefon numarası giriniz."),
  description: z
    .string()
    .trim()
    .max(500, "Açıklama en fazla 500 karakter olabilir."),
  isOpen: z.boolean(),
});

type FormValues = z.infer<typeof profileSchema>;

interface BusinessProfileFormModalProps {
  open: boolean;
  /** When true the dialog cannot be dismissed and the close button is hidden. */
  required?: boolean;
  /** Optional initial values from an existing profile (used by the editor). */
  profile?: BusinessProfile | null;
  /** Called after a successful save. */
  onSaved?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function BusinessProfileFormModal({
  open,
  required = false,
  profile,
  onSaved,
  onOpenChange,
}: BusinessProfileFormModalProps) {
  const mutation = useCreateOrUpdateBusinessProfile();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(profileSchema as never) as Resolver<FormValues>,
    defaultValues: buildDefaults(profile),
  });

  useEffect(() => {
    reset(buildDefaults(profile));
  }, [profile, reset, open]);

  const onSubmit = async (data: FormValues) => {
    try {
      await mutation.mutateAsync({
        body: {
          shopName: data.shopName.trim(),
          businessType: data.businessType.trim(),
          address: data.address.trim(),
          phone: data.phone.trim(),
          description: data.description.trim() || null,
          isOpen: data.isOpen,
        },
      });
      reset(data);
      toast.success(
        required
          ? "Mağaza profili oluşturuldu. Hoş geldiniz!"
          : "Mağaza profili güncellendi.",
      );
      onSaved?.();
      if (!required) onOpenChange?.(false);
    } catch {
      // The global onError in providers already surfaces a toast for this
      // mutation, so we don't double up here.
    }
  };

  // When the dialog is required, prevent closing via ESC / overlay / close
  // button by short-circuiting the change handler.
  const handleOpenChange = (next: boolean) => {
    if (required && !next) return;
    onOpenChange?.(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className="sm:max-w-xl"
        showCloseButton={!required}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <StoreIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <DialogTitle>
                {required
                  ? "Mağaza profilinizi oluşturun"
                  : "Mağaza Profilini Düzenle"}
              </DialogTitle>
              <DialogDescription>
                {required
                  ? "Mağaza yönetim panelini kullanabilmek için önce mağaza bilgilerinizi tamamlamanız gerekiyor."
                  : "Mağaza bilgilerinizi güncelleyin. Değişiklikler kaydedildikten sonra yayına alınır."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="shopName"
              render={({ field, fieldState }) => (
                <Field
                  label="Mağaza adı"
                  icon={<StoreIcon className="size-4" />}
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Örn: Mini Pazar"
                    autoComplete="organization"
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="businessType"
              render={({ field, fieldState }) => (
                <Field
                  label="Sektör"
                  icon={<Tag className="size-4" />}
                  hint="Örn: Market, Manav, Kasap"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Market"
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field
                label="Telefon"
                icon={<Phone className="size-4" />}
                error={fieldState.error?.message}
              >
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="tel"
                  placeholder="+90 555 000 00 00"
                  autoComplete="tel"
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field, fieldState }) => (
              <Field
                label="Adres"
                icon={<MapPin className="size-4" />}
                error={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Mahalle / Cadde / No / İlçe / İl"
                  rows={2}
                  className="min-h-12"
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <Field
                label="Açıklama"
                icon={<FileText className="size-4" />}
                hint="İsteğe bağlı — müşterilerinize kendinizi tanıtın."
                error={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Mağazanız hakkında kısa bir açıklama yazın."
                  rows={3}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="isOpen"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">
                    Mağaza şu an açık
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Müşterilerinizin mağazayı ziyaret edebileceğini gösterir.
                  </span>
                </div>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </label>
            )}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            {!required && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
              >
                İptal
              </Button>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {mutation.isPending
                ? "Kaydediliyor..."
                : required
                  ? "Profili Oluştur ve Devam Et"
                  : "Değişiklikleri Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildDefaults(profile: BusinessProfile | null | undefined): FormValues {
  if (!profile) {
    return {
      shopName: "",
      businessType: "",
      address: "",
      phone: "",
      description: "",
      isOpen: true,
    };
  }
  return {
    shopName: toStringSafe(profile.shopName),
    businessType: toStringSafe(profile.businessType),
    address: toStringSafe(profile.address),
    phone: toStringSafe(profile.phone),
    description: toStringSafe(profile.description),
    isOpen: Boolean(profile.isOpen),
  };
}

function Field({
  label,
  icon,
  hint,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {icon ? (
          <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
        ) : null}
        <span>{label}</span>
      </div>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}