"use client";

import { useEffect } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Award,
  ExternalLink,
  Gift,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorField } from "@/components/form-fields/color-field";
import { ImageUploadField } from "@/components/form-fields/image-upload-field";

import {
  useUpdateHomeCards,
  type HomeCardsFormValues,
} from "../_services/queries";

/**
 * Schema mirrors `UpdateHomeCardRequest` from the OpenAPI spec. Strings
 * are kept permissive (no length caps beyond what makes sense for cards)
 * because the backend treats null/empty equivalently and we don't want
 * to over-validate copy the shop owner hasn't written yet. Booleans are
 * always required so we never round-trip an undefined toggle.
 */
const cardSchema = z.object({
  title: z.string().trim().max(200, "Başlık en fazla 200 karakter olabilir."),
  description: z
    .string()
    .trim()
    .max(1000, "Açıklama en fazla 1000 karakter olabilir."),
  imageUrl: z.string().trim(),
  buttonName: z
    .string()
    .trim()
    .max(80, "Buton metni en fazla 80 karakter olabilir."),
  enabled: z.boolean(),
});

const featuredStoreCardSchema = z.object({
  title: z.string().trim().max(200),
  imageUrl: z.string().trim(),
  label: z.string().trim().max(80),
  labelIcon: z.string().trim(),
  enabled: z.boolean(),
  backgroundColor: z.string().trim(),
});

const stayHomeCardSchema = z.object({
  title: z.string().trim().max(200),
  description: z.string().trim().max(1000),
  imageUrl: z.string().trim(),
  appDwonloadButton: z.boolean(),
  enabled: z.boolean(),
  backgroundColor: z.string().trim(),
});

const campaignCardSchema = featuredStoreCardSchema;

const cityAdvantageCardSchema = z.object({
  title: z.string().trim().max(120),
  imageUrl: z.string().trim(),
});

const cityAdvantagesSectionSchema = z.object({
  title: z.string().trim().max(200),
  description: z.string().trim().max(1000),
  enabled: z.boolean(),
  cards: z.array(cityAdvantageCardSchema),
});

const homeCardsSchema = z.object({
  mainCard: cardSchema,
  featuredStoreCards: z.array(featuredStoreCardSchema),
  stayHomeCard: stayHomeCardSchema,
  campaignCards: z.array(campaignCardSchema),
  cityAdvantagesSection: cityAdvantagesSectionSchema,
});

type FormValues = z.infer<typeof homeCardsSchema>;

const LABEL_ICON_OPTIONS = [
  { value: "Gift", label: "Hediye" },
  { value: "CreditCard", label: "Kredi Kartı" },
  { value: "Percent", label: "İndirim" },
  { value: "Tag", label: "Etiket" },
  { value: "Truck", label: "Teslimat" },
] as const;

function emptyMainCard(): FormValues["mainCard"] {
  return {
    title: "",
    description: "",
    imageUrl: "",
    buttonName: "",
    enabled: true,
  };
}

function emptyFeaturedStoreCard(): FormValues["featuredStoreCards"][number] {
  return {
    title: "",
    imageUrl: "",
    label: "",
    labelIcon: "Gift",
    enabled: true,
    backgroundColor: "#083e74",
  };
}

function emptyStayHomeCard(): FormValues["stayHomeCard"] {
  return {
    title: "",
    description: "",
    imageUrl: "",
    appDwonloadButton: true,
    enabled: true,
    backgroundColor: "#6c1143",
  };
}

function emptyCampaignCard(): FormValues["campaignCards"][number] {
  return {
    title: "",
    imageUrl: "",
    label: "",
    labelIcon: "Gift",
    enabled: true,
    backgroundColor: "#083e74",
  };
}

function emptyAdvantageCard(): FormValues["cityAdvantagesSection"]["cards"][number] {
  return {
    title: "",
    imageUrl: "",
  };
}

/**
 * Hydrate form values from the API response. The API can return `null`
 * for image URLs, labels, and the repeatable arrays — we normalize to
 * empty strings / empty arrays so react-hook-form never has to handle
 * `undefined`. Nullable defaults mirror the seed values used elsewhere
 * in the storefront so a cold database looks identical to a populated
 * one in the editor.
 */
function buildDefaults(payload: HomeCardsFormValues | undefined): FormValues {
  if (!payload) {
    return {
      mainCard: emptyMainCard(),
      featuredStoreCards: [emptyFeaturedStoreCard(), emptyFeaturedStoreCard()],
      stayHomeCard: emptyStayHomeCard(),
      campaignCards: [],
      cityAdvantagesSection: {
        title: "",
        description: "",
        enabled: true,
        cards: [
          emptyAdvantageCard(),
          emptyAdvantageCard(),
          emptyAdvantageCard(),
          emptyAdvantageCard(),
        ],
      },
    };
  }

  return {
    mainCard: {
      title: payload.mainCard.title ?? "",
      description: payload.mainCard.description ?? "",
      imageUrl: payload.mainCard.imageUrl ?? "",
      buttonName: payload.mainCard.buttonName ?? "",
      enabled: payload.mainCard.enabled,
    },
    featuredStoreCards:
      payload.featuredStoreCards && payload.featuredStoreCards.length > 0
        ? payload.featuredStoreCards.map((card) => ({
            title: card.title ?? "",
            imageUrl: card.imageUrl ?? "",
            label: card.label ?? "",
            labelIcon: card.labelIcon ?? "Gift",
            enabled: card.enabled,
            backgroundColor: card.backgroundColor ?? "#083e74",
          }))
        : [emptyFeaturedStoreCard(), emptyFeaturedStoreCard()],
    stayHomeCard: {
      title: payload.stayHomeCard.title ?? "",
      description: payload.stayHomeCard.description ?? "",
      imageUrl: payload.stayHomeCard.imageUrl ?? "",
      appDwonloadButton: payload.stayHomeCard.appDwonloadButton,
      enabled: payload.stayHomeCard.enabled,
      backgroundColor: payload.stayHomeCard.backgroundColor ?? "#6c1143",
    },
    campaignCards:
      payload.campaignCards?.map((card) => ({
        title: card.title ?? "",
        imageUrl: card.imageUrl ?? "",
        label: card.label ?? "",
        labelIcon: card.labelIcon ?? "Gift",
        enabled: card.enabled,
        backgroundColor: card.backgroundColor ?? "#083e74",
      })) ?? [],
    cityAdvantagesSection: {
      title: payload.cityAdvantagesSection.title ?? "",
      description: payload.cityAdvantagesSection.description ?? "",
      enabled: payload.cityAdvantagesSection.enabled,
      cards:
        payload.cityAdvantagesSection.cards &&
        payload.cityAdvantagesSection.cards.length > 0
          ? payload.cityAdvantagesSection.cards.map((card) => ({
              title: card.title ?? "",
              imageUrl: card.imageUrl ?? "",
            }))
          : [
              emptyAdvantageCard(),
              emptyAdvantageCard(),
              emptyAdvantageCard(),
              emptyAdvantageCard(),
            ],
    },
  };
}

/**
 * Empty strings coming back from `buildDefaults` are sent as `null` on
 * the wire so the backend can treat "user cleared the field" and "user
 * never set it" identically.
 *
 * Repeatable arrays (`featuredStoreCards`, `campaignCards`) are always
 * sent as arrays even when empty. The OpenAPI spec marks them nullable
 * (`T[] | null`), but the ASP.NET backend decorates the corresponding
 * properties with `[Required]` and rejects `null` with HTTP 400
 * ("The CampaignCards field is required."). Sending `[]` keeps the
 * payload valid for both behaviors.
 */
function toPayload(values: FormValues): HomeCardsFormValues {
  const nullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };

  return {
    mainCard: {
      title: nullable(values.mainCard.title),
      description: nullable(values.mainCard.description),
      imageUrl: nullable(values.mainCard.imageUrl),
      buttonName: nullable(values.mainCard.buttonName),
      enabled: values.mainCard.enabled,
    },
    featuredStoreCards: values.featuredStoreCards.map((card) => ({
      title: nullable(card.title),
      imageUrl: nullable(card.imageUrl),
      label: nullable(card.label),
      labelIcon: nullable(card.labelIcon),
      enabled: card.enabled,
      backgroundColor: nullable(card.backgroundColor),
    })),
    stayHomeCard: {
      title: nullable(values.stayHomeCard.title),
      description: nullable(values.stayHomeCard.description),
      imageUrl: nullable(values.stayHomeCard.imageUrl),
      appDwonloadButton: values.stayHomeCard.appDwonloadButton,
      enabled: values.stayHomeCard.enabled,
      backgroundColor: nullable(values.stayHomeCard.backgroundColor),
    },
    campaignCards: values.campaignCards.map((card) => ({
      title: nullable(card.title),
      imageUrl: nullable(card.imageUrl),
      label: nullable(card.label),
      labelIcon: nullable(card.labelIcon),
      enabled: card.enabled,
      backgroundColor: nullable(card.backgroundColor),
    })),
    cityAdvantagesSection: {
      title: nullable(values.cityAdvantagesSection.title),
      description: nullable(values.cityAdvantagesSection.description),
      enabled: values.cityAdvantagesSection.enabled,
      cards: values.cityAdvantagesSection.cards.map((card) => ({
        title: nullable(card.title),
        imageUrl: nullable(card.imageUrl),
      })),
    },
  };
}

export function HomeCardsForm({
  payload,
}: {
  payload: HomeCardsFormValues | undefined;
}) {
  const updateMutation = useUpdateHomeCards();

  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(homeCardsSchema as never) as Resolver<FormValues>,
    defaultValues: buildDefaults(payload),
  });

  useEffect(() => {
    reset(buildDefaults(payload));
  }, [payload, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateMutation.mutateAsync({ body: toPayload(data) });
      reset(data);
      toast.success("Anasayfa kartları güncellendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Anasayfa kartları kaydedilirken bir hata oluştu.";
      toast.error(message);
    }
  };

  const isDirty = formState.isDirty;
  const isSubmitting = updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Tabs defaultValue="main">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="main">
            <Sparkles />
            Anasayfa Kartı
          </TabsTrigger>
          <TabsTrigger value="featured">
            <Award />
            Öne Çıkan Mağaza
          </TabsTrigger>
          <TabsTrigger value="stayHome">
            <ImageIcon />
            Evde Kal
          </TabsTrigger>
          <TabsTrigger value="campaign">
            <Megaphone />
            Kampanya
          </TabsTrigger>
          <TabsTrigger value="cityAdvantages">
            <Gift />
            Şehir Avantajları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-6 flex flex-col gap-5">
          <MainCardSection control={control} />
        </TabsContent>

        <TabsContent value="featured" className="mt-6 flex flex-col gap-5">
          <FeaturedStoreCardsSection control={control} />
        </TabsContent>

        <TabsContent value="stayHome" className="mt-6 flex flex-col gap-5">
          <StayHomeCardSection control={control} />
        </TabsContent>

        <TabsContent value="campaign" className="mt-6 flex flex-col gap-5">
          <CampaignCardsSection control={control} />
        </TabsContent>

        <TabsContent value="cityAdvantages" className="mt-6 flex flex-col gap-5">
          <CityAdvantagesSection control={control} />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card/80 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <span className="mr-auto text-xs text-muted-foreground">
          {isDirty
            ? "Kaydedilmemiş değişiklikleriniz var."
            : "Tüm değişiklikler kaydedildi."}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(buildDefaults(payload))}
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

      {/*
        `target="_blank"` so the merchant can flip back to the editor
        without losing their unsaved state. The home cards query is
        invalidated on success, so a fresh tab will show the updates.
      */}
      <div className="-mt-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          render={<Link href="/" target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="size-4" />
          Sonucu Gör
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

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
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
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

function LabelIconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select
      value={value || "Gift"}
      onValueChange={(next) => onChange(next ?? "Gift")}
    >
      <SelectTrigger>
        <SelectValue placeholder="Simge seçin" />
      </SelectTrigger>
      <SelectContent>
        {LABEL_ICON_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MainCardSection({
  control,
}: {
  control: UseFormReturn<FormValues>["control"];
}) {
  return (
    <>
      <SectionHeader
        title="Anasayfa ana kartı"
        description="Mağaza açılışında en üstte gösterilen büyük tanıtım kartı."
      />
      <Controller
        control={control}
        name="mainCard.title"
        render={({ field, fieldState }) => (
          <Field
            label="Başlık"
            description="Satır sonları için \n kullanabilirsiniz."
            error={fieldState.error?.message}
          >
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Marketi ayağiniza getiriyoruz"
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="mainCard.description"
        render={({ field, fieldState }) => (
          <Field
            label="Açıklama"
            error={fieldState.error?.message}
          >
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder="Organik ürünler ve sürdürülebilir kaynaklı market teslimatı."
              rows={3}
            />
          </Field>
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
        <Controller
          control={control}
          name="mainCard.imageUrl"
          render={({ field }) => (
            <ImageUploadField
              label="Görsel"
              description="Önerilen: dikey, şeffaf arka plan (PNG/SVG)."
              value={field.value ?? ""}
              onChange={field.onChange}
              // Backend's POST /api/Admin/UploadImage only whitelists
              // (product|category|logo|slider|about). All home-page
              // banner/hero images route through the "slider" bucket.
              type="slider"
              aspect="wide"
            />
          )}
        />
        <Controller
          control={control}
          name="mainCard.buttonName"
          render={({ field, fieldState }) => (
            <Field
              label="Buton metni"
              error={fieldState.error?.message}
            >
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Şimdi incele"
              />
            </Field>
          )}
        />
      </div>
      <Controller
        control={control}
        name="mainCard.enabled"
        render={({ field }) => (
          <ToggleField
            label="Anasayfa kartı aktif"
            description="Devre dışı bırakırsanız vitrinde gösterilmez."
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </>
  );
}

function FeaturedStoreCardsSection({
  control,
}: {
  control: UseFormReturn<FormValues>["control"];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "featuredStoreCards",
  });

  return (
    <>
      <SectionHeader
        title="Öne çıkan mağaza kartları"
        description="Anasayfada gösterilen tanıtım bannerları (örn. ücretsiz teslimat, üyelik kartı)."
      />
      <div className="flex flex-col gap-4">
        {fields.map((fieldItem, index) => (
          <div
            key={fieldItem.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Kart #{index + 1}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                aria-label={`Kart ${index + 1} kaldır`}
              >
                <Trash2 className="size-4" />
                Kaldır
              </Button>
            </div>
            <Controller
              control={control}
              name={`featuredStoreCards.${index}.title`}
              render={({ field, fieldState }) => (
                <Field
                  label="Başlık"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="%50'ye varan indirim"
                  />
                </Field>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name={`featuredStoreCards.${index}.label`}
                render={({ field, fieldState }) => (
                  <Field
                    label="Etiket metni"
                    error={fieldState.error?.message}
                  >
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Ücretsiz teslimat"
                    />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name={`featuredStoreCards.${index}.labelIcon`}
                render={({ field }) => (
                  <Field label="Etiket simgesi">
                    <LabelIconSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </div>
            <Controller
              control={control}
              name={`featuredStoreCards.${index}.imageUrl`}
              render={({ field }) => (
                <ImageUploadField
                  label="Görsel"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  type="slider"
                  aspect="wide"
                />
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name={`featuredStoreCards.${index}.backgroundColor`}
                render={({ field }) => (
                  <ColorField
                    label="Arka plan rengi"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name={`featuredStoreCards.${index}.enabled`}
                render={({ field }) => (
                  <ToggleField
                    label="Bu kartı göster"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(emptyFeaturedStoreCard())}
        disabled={fields.length >= 6}
      >
        <Plus className="size-4" />
        Yeni öne çıkan kart ekle
      </Button>
    </>
  );
}

function StayHomeCardSection({
  control,
}: {
  control: UseFormReturn<FormValues>["control"];
}) {
  return (
    <>
      <SectionHeader
        title="Evde kal kartı"
        description="Mobil uygulama indirme çağrısı yapan tek satırlık tanıtım kartı."
      />
      <Controller
        control={control}
        name="stayHomeCard.title"
        render={({ field, fieldState }) => (
          <Field
            label="Başlık"
            error={fieldState.error?.message}
          >
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Evde Kal, Tüm İhtiyaçlarınızı Marketimizden Alın!"
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="stayHomeCard.description"
        render={({ field, fieldState }) => (
          <Field
            label="Açıklama"
            error={fieldState.error?.message}
          >
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder="App Store veya Google Play'den uygulamayı indirin"
              rows={2}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="stayHomeCard.imageUrl"
        render={({ field }) => (
          <ImageUploadField
            label="Görsel"
            value={field.value ?? ""}
            onChange={field.onChange}
            type="slider"
            aspect="wide"
          />
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="stayHomeCard.backgroundColor"
          render={({ field }) => (
            <ColorField
              label="Arka plan rengi"
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="stayHomeCard.appDwonloadButton"
          render={({ field }) => (
            <ToggleField
              label="Uygulama indirme butonu"
              description="Açıksa App Store ve Google Play rozetleri gösterilir."
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
      <Controller
        control={control}
        name="stayHomeCard.enabled"
        render={({ field }) => (
          <ToggleField
            label="Evde kal kartı aktif"
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </>
  );
}

function CampaignCardsSection({
  control,
}: {
  control: UseFormReturn<FormValues>["control"];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "campaignCards",
  });

  return (
    <>
      <SectionHeader
        title="Kampanya kartları"
        description="Anasayfada kampanya / promosyon bannerları olarak gösterilen kartlar."
      />
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Henüz kampanya kartı eklenmedi.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Kampanya #{index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  aria-label={`Kampanya ${index + 1} kaldır`}
                >
                  <Trash2 className="size-4" />
                  Kaldır
                </Button>
              </div>
              <Controller
                control={control}
                name={`campaignCards.${index}.title`}
                render={({ field, fieldState }) => (
                  <Field
                    label="Başlık"
                    error={fieldState.error?.message}
                  >
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Yaz kampanyası"
                    />
                  </Field>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name={`campaignCards.${index}.label`}
                  render={({ field, fieldState }) => (
                    <Field
                      label="Etiket metni"
                      error={fieldState.error?.message}
                    >
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Yeni"
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name={`campaignCards.${index}.labelIcon`}
                  render={({ field }) => (
                    <Field label="Etiket simgesi">
                      <LabelIconSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </Field>
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`campaignCards.${index}.imageUrl`}
                render={({ field }) => (
                  <ImageUploadField
                    label="Görsel"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    type="slider"
                    aspect="wide"
                  />
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name={`campaignCards.${index}.backgroundColor`}
                  render={({ field }) => (
                    <ColorField
                      label="Arka plan rengi"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`campaignCards.${index}.enabled`}
                  render={({ field }) => (
                    <ToggleField
                      label="Bu kartı göster"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(emptyCampaignCard())}
        disabled={fields.length >= 6}
      >
        <Plus className="size-4" />
        Yeni kampanya kartı ekle
      </Button>
    </>
  );
}

function CityAdvantagesSection({
  control,
}: {
  control: UseFormReturn<FormValues>["control"];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cityAdvantagesSection.cards",
  });

  return (
    <>
      <SectionHeader
        title="Şehir avantajları bölümü"
        description="Anasayfada grid şeklinde gösterilen hediye çeki, hediye kartı gibi avantajlar."
      />
      <Controller
        control={control}
        name="cityAdvantagesSection.title"
        render={({ field, fieldState }) => (
          <Field
            label="Bölüm başlığı"
            error={fieldState.error?.message}
          >
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Size her zaman şehrin en iyisini sunuyoruz"
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="cityAdvantagesSection.description"
        render={({ field, fieldState }) => (
          <Field
            label="Bölüm açıklaması"
            error={fieldState.error?.message}
          >
            <Textarea
              {...field}
              value={field.value ?? ""}
              rows={3}
              placeholder="2007'den beri ürün geliştirme, destek ve güncellemelerde mükemmellik."
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="cityAdvantagesSection.enabled"
        render={({ field }) => (
          <ToggleField
            label="Şehir avantajları bölümü aktif"
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <div className="flex flex-col gap-4">
        {fields.map((fieldItem, index) => (
          <div
            key={fieldItem.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Avantaj #{index + 1}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                aria-label={`Avantaj ${index + 1} kaldır`}
              >
                <Trash2 className="size-4" />
                Kaldır
              </Button>
            </div>
            <Controller
              control={control}
              name={`cityAdvantagesSection.cards.${index}.title`}
              render={({ field, fieldState }) => (
                <Field
                  label="Başlık"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Hediye çeki"
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name={`cityAdvantagesSection.cards.${index}.imageUrl`}
              render={({ field }) => (
                <ImageUploadField
                  label="Görsel"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  type="slider"
                  aspect="square"
                  size="sm"
                />
              )}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(emptyAdvantageCard())}
        disabled={fields.length >= 8}
      >
        <Plus className="size-4" />
        Yeni avantaj kartı ekle
      </Button>
    </>
  );
}