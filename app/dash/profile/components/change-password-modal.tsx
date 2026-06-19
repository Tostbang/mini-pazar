"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";
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

const formSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Mevcut şifre en az 6 karakter olmalıdır."),
    newPassword: z
      .string()
      .min(6, "Yeni şifre en az 6 karakter olmalıdır."),
    confirmNewPassword: z
      .string()
      .min(6, "Yeni şifre (tekrar) en az 6 karakter olmalıdır."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Yeni şifreler eşleşmiyor.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Yeni şifre mevcut şifreden farklı olmalıdır.",
    path: ["newPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const mutation = useMutationOP("put", "/api/User/ChangeMyPassword");

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await mutation.mutateAsync({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      });
      toast.success("Şifreniz başarıyla güncellendi.");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Lock className="size-5" />
            </div>
            <div>
              <DialogTitle>Şifre Değiştir</DialogTitle>
              <DialogDescription>
                Mevcut şifrenizi ve yeni şifrenizi girin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormInput
            type="password"
            name="currentPassword"
            label="Mevcut Şifre"
            control={control}
            placeholder="Mevcut şifrenizi girin"
            autoComplete="current-password"
          />
          <FormInput
            type="password"
            name="newPassword"
            label="Yeni Şifre"
            control={control}
            placeholder="Yeni şifrenizi girin"
            autoComplete="new-password"
          />
          <FormInput
            type="password"
            name="confirmNewPassword"
            label="Yeni Şifre (Tekrar)"
            control={control}
            placeholder="Yeni şifrenizi tekrar girin"
            autoComplete="new-password"
          />
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
              ) : null}
              {mutation.isPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
