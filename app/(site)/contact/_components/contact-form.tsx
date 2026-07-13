"use client";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSendSupportMessage } from "../_services/mutations";

// Ad/Soyad için sadece Türkçe harf + boşluk + tire (örn. "Ayşe Nur", "Şahin")
// kabul edilir. Rakamlar ve özel karakterler (nokta, virgül, @, ! vb.) yasaktır.
const NAME_REGEX = /^[\p{L}][\p{L}\s'-]*$/u;

const formSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalıdır.")
    .max(40, "Ad en fazla 40 karakter olabilir.")
    .regex(
      NAME_REGEX,
      "Ad sadece harf içermelidir; rakam veya özel karakter kullanılamaz.",
    ),
  lastName: z
    .string()
    .trim()
    .min(2, "Soyad en az 2 karakter olmalıdır.")
    .max(40, "Soyad en fazla 40 karakter olabilir.")
    .regex(
      NAME_REGEX,
      "Soyad sadece harf içermelidir; rakam veya özel karakter kullanılamaz.",
    ),
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
  title: z
    .string()
    .trim()
    .min(3, "Konu en az 3 karakter olmalıdır.")
    .max(120, "Konu en fazla 120 karakter olabilir."),
  message: z
    .string()
    .trim()
    .min(10, "Mesaj en az 10 karakter olmalıdır.")
    .max(2000, "Mesaj en fazla 2000 karakter olabilir."),
});

type FormValues = z.infer<typeof formSchema>;

const inputClassName =
  "h-11 rounded-lg border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/30";

const SUCCESS_MESSAGE =
  "Mesajınız başarıyla iletildi. En kısa sürede sizinle iletişime geçeceğiz.";

export function ContactForm() {
  const sendMutation = useSendSupportMessage();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      title: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await sendMutation.mutateAsync({
        body: {
          name: data.firstName.trim(),
          surname: data.lastName.trim(),
          email: data.email.trim(),
          title: data.title.trim(),
          message: data.message.trim(),
        },
      });
      toast.success(SUCCESS_MESSAGE);
      reset();
    } catch {
      // fetch.ts already surfaces the API error message via toast.
    }
  };

  const isPending = isSubmitting || sendMutation.isPending;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <MessageSquare className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Bize yazın
          </h2>
          <p className="text-xs text-muted-foreground">
            Tüm alanlar zorunludur. Yanıt e-posta adresinize gönderilir.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
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
            disabled={isPending}
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
            disabled={isPending}
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
          disabled={isPending}
        />

        <FormInput
          type="text"
          name="title"
          label="Konu"
          control={control}
          placeholder="Mesajınızın konusu"
          className={inputClassName}
          disabled={isPending}
        />

        <Controller
          control={control}
          name="message"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Mesajınız
              </span>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="Mesajınızı buraya yazın..."
                rows={6}
                aria-invalid={fieldState.invalid}
                disabled={isPending}
              />
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

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-sm font-semibold sm:w-auto sm:self-end"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Mesajı Gönder
            </>
          )}
        </Button>
      </form>
    </section>
  );
}