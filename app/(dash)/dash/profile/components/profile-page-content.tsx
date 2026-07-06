"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  Lock,
  Pencil,
  Trash2,
  Mail,
  Phone,
  IdCard,
  CheckCircle2,
  CircleAlert,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import { useProfileStore } from "@/lib/store/profile-store";
import { deleteToken, toStringSafe } from "@/lib/helpers";
import { clearPersistedCache } from "@/lib/query-persist";
import { EditProfileModal } from "./edit-profile-modal";
import { ChangePasswordModal } from "./change-password-modal";
import { ResetPasswordModal } from "./reset-password-modal";

export function ProfilePageContent() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const profileQuery = useQueryOP("get", "/api/User/GetMyProfile");
  const deleteMutation = useMutationOP("delete", "/api/User/DeleteMyAccount");

  const refreshProfile = async () => {
    const response = await profileQuery.refetch();
    if (response.data?.user) {
      setProfile(response.data.user);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteMutation.mutateAsync({});
      // Wipe every user-specific piece of state so the next account that
      // signs up on this tab cannot see this user's profile, cart, or
      // query results.
      queryClient.clear();
      clearPersistedCache();
      setProfile(null);
      deleteToken();
      toast.success("Hesabınız silindi.");
      setDeleteOpen(false);
      router.replace("/register");
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Hesap silinirken bir hata oluştu.");
      }
    }
  };

  const isLoading = profileQuery.isLoading || !profile;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Profil Ayarları
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil bilgilerinizi görüntüleyin ve düzenleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Settings className="size-5" />
              </div>
              <CardTitle>Ayarlar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mx-auto flex size-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-card">
              <User className="size-12 text-muted-foreground" />
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                onClick={() => setPasswordOpen(true)}
                className="h-11 w-full"
                disabled={isLoading || deleteMutation.isPending}
                variant="outline"
              >
                <Lock className="size-4" />
                Şifre Değiştir
              </Button>
              <Button
                onClick={() => setResetOpen(true)}
                className="h-11 w-full"
                disabled={isLoading || deleteMutation.isPending}
                variant="outline"
              >
                <ShieldAlert className="size-4" />
                Şifreyi Sıfırla
              </Button>
              <Button
                onClick={() => setEditOpen(true)}
                className="h-11 w-full"
                disabled={isLoading || deleteMutation.isPending}
              >
                <Pencil className="size-4" />
                Profili Düzenle
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                className="h-11 w-full"
                disabled={isLoading || deleteMutation.isPending}
              >
                <Trash2 className="size-4" />
                Hesabı Sil
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <IdCard className="size-5" />
                </div>
                <div>
                  <CardTitle>Kişisel Bilgiler</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hesabınıza ait bilgiler
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="Ad"
                    value={toStringSafe(profile?.firstName) || "—"}
                  />
                  <InfoItem
                    label="Soyad"
                    value={toStringSafe(profile?.lastName) || "—"}
                  />
                </div>
                <InfoItem
                  label="E-posta Adresi"
                  value={toStringSafe(profile?.email) || "—"}
                  icon={<Mail className="size-4" />}
                  trailing={
                    profile?.emailConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-3" />
                        Doğrulandı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <CircleAlert className="size-3" />
                        Doğrulanmadı
                      </span>
                    )
                  }
                />
                <InfoItem
                  label="Telefon"
                  value={toStringSafe(profile?.phone) || "—"}
                  icon={<Phone className="size-4" />}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {profile && (
        <>
          <EditProfileModal
            open={editOpen}
            onOpenChange={setEditOpen}
            profile={profile}
            onUpdated={refreshProfile}
          />
          <ChangePasswordModal
            open={passwordOpen}
            onOpenChange={setPasswordOpen}
          />
          <ResetPasswordModal
            open={resetOpen}
            onOpenChange={setResetOpen}
          />
        </>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Hesabı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteAccount();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Hesabı Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  trailing,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold sm:text-base">{value}</p>
        {trailing}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="lg:col-span-3" aria-busy>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
