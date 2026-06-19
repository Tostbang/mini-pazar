"use client";

import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Brush,
  CreditCard,
  LayoutList,
  Loader2,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useUpdateSiteSettings,
  type SiteSettings,
  type SiteSettingsFormValues,
} from "../_services/queries";
import { ColorField } from "./color-field";
import { ImageUploadField } from "./image-upload-field";

const settingsSchema = z.object({
  siteName: z.string().trim().max(120, "Site adı en fazla 120 karakter olabilir."),
  siteTagline: z
    .string()
    .trim()
    .max(160, "Slogan en fazla 160 karakter olabilir."),
  primaryColor: z.string().trim(),
  secondaryColor: z.string().trim(),
  accentColor: z.string().trim(),
  backgroundColor: z.string().trim(),
  textColor: z.string().trim(),
  customCss: z.string(),
  logoUrl: z.string().trim(),
  faviconUrl: z.string().trim(),
  currency: z
    .string()
    .trim()
    .min(2, "Para birimi kodu en az 2 karakter olmalıdır.")
    .max(8, "Para birimi kodu en fazla 8 karakter olabilir."),
  isPurchasingEnabled: z.boolean(),
  allowCashOnDelivery: z.boolean(),
  allowOnlinePayment: z.boolean(),
  shippingFee: z.number().min(0, "Kargo ücreti 0'dan küçük olamaz."),
  freeShippingThreshold: z.number().nullable(),
  sliderSectionOrder: z.number().int().min(0),
  categorySectionOrder: z.number().int().min(0),
  productSectionOrder: z.number().int().min(0),
  aboutSectionOrder: z.number().int().min(0),
  contactSectionOrder: z.number().int().min(0),
  supportSectionOrder: z.number().int().min(0),
  footerText: z.string().trim().max(500),
  contactEmail: z
    .string()
    .trim()
    .max(160)
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Geçerli bir e-posta adresi girin.",
    ),
  contactPhone: z.string().trim().max(40),
});

type FormValues = z.infer<typeof settingsSchema>;

function buildDefaults(settings: SiteSettings | undefined): FormValues {
  return {
    siteName: settings?.siteName ?? "",
    siteTagline: settings?.siteTagline ?? "",
    primaryColor: settings?.primaryColor ?? "",
    secondaryColor: settings?.secondaryColor ?? "",
    accentColor: settings?.accentColor ?? "",
    backgroundColor: settings?.backgroundColor ?? "",
    textColor: settings?.textColor ?? "",
    customCss: settings?.customCss ?? "",
    logoUrl: settings?.logoUrl ?? "",
    faviconUrl: settings?.faviconUrl ?? "",
    currency: settings?.currency ?? "TRY",
    isPurchasingEnabled: settings?.isPurchasingEnabled ?? true,
    allowCashOnDelivery: settings?.allowCashOnDelivery ?? false,
    allowOnlinePayment: settings?.allowOnlinePayment ?? false,
    shippingFee: settings?.shippingFee ?? 0,
    freeShippingThreshold: settings?.freeShippingThreshold ?? null,
    sliderSectionOrder: settings?.sliderSectionOrder ?? 0,
    categorySectionOrder: settings?.categorySectionOrder ?? 0,
    productSectionOrder: settings?.productSectionOrder ?? 0,
    aboutSectionOrder: settings?.aboutSectionOrder ?? 0,
    contactSectionOrder: settings?.contactSectionOrder ?? 0,
    supportSectionOrder: settings?.supportSectionOrder ?? 0,
    footerText: settings?.footerText ?? "",
    contactEmail: settings?.contactEmail ?? "",
    contactPhone: settings?.contactPhone ?? "",
  };
}

function toPayload(values: FormValues): SiteSettingsFormValues {
  return {
    siteName: values.siteName.trim() || null,
    siteTagline: values.siteTagline.trim() || null,
    primaryColor: values.primaryColor.trim() || null,
    secondaryColor: values.secondaryColor.trim() || null,
    accentColor: values.accentColor.trim() || null,
    backgroundColor: values.backgroundColor.trim() || null,
    textColor: values.textColor.trim() || null,
    customCss: values.customCss || null,
    logoUrl: values.logoUrl.trim() || null,
    faviconUrl: values.faviconUrl.trim() || null,
    currency: values.currency.trim() || null,
    isPurchasingEnabled: values.isPurchasingEnabled,
    allowCashOnDelivery: values.allowCashOnDelivery,
    allowOnlinePayment: values.allowOnlinePayment,
    shippingFee: values.shippingFee,
    freeShippingThreshold: values.freeShippingThreshold,
    sliderSectionOrder: values.sliderSectionOrder,
    categorySectionOrder: values.categorySectionOrder,
    productSectionOrder: values.productSectionOrder,
    aboutSectionOrder: values.aboutSectionOrder,
    contactSectionOrder: values.contactSectionOrder,
    supportSectionOrder: values.supportSectionOrder,
    footerText: values.footerText.trim() || null,
    contactEmail: values.contactEmail.trim() || null,
    contactPhone: values.contactPhone.trim() || null,
  };
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const updateMutation = useUpdateSiteSettings();

  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(settingsSchema as never) as Resolver<FormValues>,
    defaultValues: buildDefaults(settings),
  });

  useEffect(() => {
    reset(buildDefaults(settings));
  }, [settings, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateMutation.mutateAsync({ body: toPayload(data) });
      reset(data);
      toast.success("Ayarlar kaydedildi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ayarlar kaydedilirken bir hata oluştu.";
      toast.error(message);
    }
  };

  const isDirty = formState.isDirty;
  const isSubmitting = updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <Tabs defaultValue="general">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">
            <SettingsIcon />
            Genel
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Brush />
            Görsel Kimlik
          </TabsTrigger>
          <TabsTrigger value="commerce">
            <CreditCard />
            Satış
          </TabsTrigger>
          <TabsTrigger value="layout">
            <LayoutList />
            Düzen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 flex flex-col gap-5">
          <SectionHeader
            title="Mağaza bilgileri"
            description="Ziyaretçilere ve müşterilere gösterilen temel bilgileri buradan yönetin."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="siteName"
              render={({ field, fieldState }) => (
                <Field label="Site adı" error={fieldState.error?.message}>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Mini Pazar"
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="currency"
              render={({ field, fieldState }) => (
                <Field
                  label="Para birimi"
                  description="ISO 4217 kodu (TRY, USD, EUR…)"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="TRY"
                    className="uppercase"
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            control={control}
            name="siteTagline"
            render={({ field, fieldState }) => (
              <Field label="Slogan" error={fieldState.error?.message}>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Tazeliği hemen yaşayın"
                />
              </Field>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="contactEmail"
              render={({ field, fieldState }) => (
                <Field
                  label="İletişim e-postası"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    type="email"
                    value={field.value ?? ""}
                    placeholder="iletisim@magazaniz.com"
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="contactPhone"
              render={({ field, fieldState }) => (
                <Field
                  label="İletişim telefonu"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    type="tel"
                    value={field.value ?? ""}
                    placeholder="+90 555 000 00 00"
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            control={control}
            name="footerText"
            render={({ field, fieldState }) => (
              <Field
                label="Alt bilgi (footer) metni"
                description="Site alt bilgisinde görünecek kısa metin."
                error={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="© 2024 Mini Pazar. Tüm hakları saklıdır."
                  rows={3}
                />
              </Field>
            )}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-6 flex flex-col gap-6">
          <SectionHeader
            title="Logo ve favicon"
            description="Mağazanızın görsel kimliğini oluşturan logoyu ve favicon'u yükleyin."
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_220px]">
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Logo"
                  description="Önerilen: yatay, şeffaf arka plan (PNG/SVG)."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  type="logo"
                  aspect="wide"
                />
              )}
            />
            <Controller
              control={control}
              name="faviconUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Favicon"
                  description="32x32 px önerilir."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  type="favicon"
                />
              )}
            />
          </div>

          <SectionHeader
            title="Tema renkleri"
            description="Mağaza vitrininin renk paletini özelleştirin."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Controller
              control={control}
              name="primaryColor"
              render={({ field }) => (
                <ColorField
                  label="Birincil renk"
                  description="Ana butonlar ve vurgulamalar."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="secondaryColor"
              render={({ field }) => (
                <ColorField
                  label="İkincil renk"
                  description="Yan eylemler için."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="accentColor"
              render={({ field }) => (
                <ColorField
                  label="Vurgu rengi"
                  description="Etiketler ve badge'ler."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="backgroundColor"
              render={({ field }) => (
                <ColorField
                  label="Arka plan rengi"
                  description="Sayfa arka planı."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="textColor"
              render={({ field }) => (
                <ColorField
                  label="Metin rengi"
                  description="Birincil metin rengi."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <SectionHeader
            title="Özel CSS"
            description="İleri seviye stil değişiklikleri için CSS ekleyin. Boş bırakılabilir."
          />
          <Controller
            control={control}
            name="customCss"
            render={({ field, fieldState }) => (
              <Field error={fieldState.error?.message}>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder=".my-custom-class { color: hotpink; }"
                  rows={8}
                  className="font-mono text-xs"
                />
              </Field>
            )}
          />
        </TabsContent>

        <TabsContent value="commerce" className="mt-6 flex flex-col gap-6">
          <SectionHeader
            title="Satış ayarları"
            description="Müşterilerinizin alışveriş yapma deneyimini kontrol edin."
          />

          <Controller
            control={control}
            name="isPurchasingEnabled"
            render={({ field }) => (
              <ToggleField
                label="Sipariş alma aktif"
                description="Devre dışı bırakırsanız müşteriler sepete ekleyip ödeme yapamaz."
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <SectionHeader title="Ödeme yöntemleri" />
          <div className="grid grid-cols-1 gap-3">
            <Controller
              control={control}
              name="allowOnlinePayment"
              render={({ field }) => (
                <ToggleField
                  label="Online ödeme"
                  description="Kredi kartı / dijital cüzdan ödemeleri."
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="allowCashOnDelivery"
              render={({ field }) => (
                <ToggleField
                  label="Kapıda ödeme"
                  description="Müşteri siparişi teslim alırken nakit/kart ile öder."
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <SectionHeader title="Kargo" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="shippingFee"
              render={({ field, fieldState }) => (
                <Field
                  label="Kargo ücreti (₺)"
                  error={fieldState.error?.message}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;
                      field.onChange(value === "" ? 0 : parseFloat(value));
                    }}
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="freeShippingThreshold"
              render={({ field, fieldState }) => (
                <Field
                  label="Ücretsiz kargo eşiği (₺)"
                  description="Bu tutarın üzerindeki siparişlerde kargo bedava. Boş bırakılırsa devre dışı."
                  error={fieldState.error?.message}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    placeholder="Devre dışı"
                    value={
                      field.value === null || field.value === undefined
                        ? ""
                        : field.value
                    }
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;
                      field.onChange(value === "" ? null : parseFloat(value));
                    }}
                  />
                </Field>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="layout" className="mt-6 flex flex-col gap-5">
          <SectionHeader
            title="Bölüm sıralaması"
            description="Ana sayfada gösterilen bölümlerin sırasını belirleyin. Küçük sayı önce gösterilir."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SectionOrderField
              control={control}
              name="sliderSectionOrder"
              label="Slider"
            />
            <SectionOrderField
              control={control}
              name="categorySectionOrder"
              label="Kategoriler"
            />
            <SectionOrderField
              control={control}
              name="productSectionOrder"
              label="Ürünler"
            />
            <SectionOrderField
              control={control}
              name="aboutSectionOrder"
              label="Hakkımızda"
            />
            <SectionOrderField
              control={control}
              name="contactSectionOrder"
              label="İletişim"
            />
            <SectionOrderField
              control={control}
              name="supportSectionOrder"
              label="Destek"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-border bg-card/80 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <span className="mr-auto text-xs text-muted-foreground">
          {isDirty
            ? "Kaydedilmemiş değişiklikleriniz var."
            : "Tüm değişiklikler kaydedildi."}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(buildDefaults(settings))}
          disabled={!isDirty || isSubmitting}
        >
          Sıfırla
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function Field({
  label,
  description,
  error,
  children,
}: {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function SectionOrderField({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"];
  name:
    | "sliderSectionOrder"
    | "categorySectionOrder"
    | "productSectionOrder"
    | "aboutSectionOrder"
    | "contactSectionOrder"
    | "supportSectionOrder";
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field label={label} error={fieldState.error?.message}>
          <Input
            type="number"
            inputMode="numeric"
            step="1"
            min={0}
            value={Number.isFinite(field.value) ? field.value : ""}
            onChange={(event) => {
              const value = (event.target as HTMLInputElement).value;
              field.onChange(value === "" ? 0 : parseInt(value, 10));
            }}
          />
        </Field>
      )}
    />
  );
}
