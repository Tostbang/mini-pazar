"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Globe2,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/format";
import { DeleteUserDialog } from "../_components/delete-user-dialog";
import { UserStatusBadge } from "../_components/user-status-badge";
import { getUserRoleLabel } from "../_components/user-role-label";
import { useGetUserById } from "../_services/queries";

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

function fullName(
  user:
    | { firstName: string | null; lastName: string | null; email: string | null }
    | null
    | undefined,
) {
  if (!user) return "İsimsiz Kullanıcı";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "İsimsiz Kullanıcı";
}

function initials(
  user:
    | { firstName: string | null; lastName: string | null; email: string | null }
    | null
    | undefined,
) {
  if (!user) return "?";
  if (!user.firstName && !user.lastName) {
    return (user.email ?? "?").slice(0, 2).toUpperCase();
  }
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

export default function CustomerDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = Number(params?.userId);
  const isValidId = Number.isFinite(userId) && userId > 0;

  const userQuery = useGetUserById(
    { targetUserId: isValidId ? userId : 0 },
    { enabled: isValidId },
  );

  const [deleteOpen, setDeleteOpen] = useState(false);

  const user = userQuery.data?.user ?? null;

  if (!isValidId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dash/customers" />}
          className="self-start"
        >
          <ArrowLeft className="size-4" />
          Müşterilere dön
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Geçersiz kullanıcı</CardTitle>
            <CardDescription>
              Aradığınız kullanıcı kimliği geçerli değil.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (userQuery.isLoading) {
    return <CustomerDetailSkeleton />;
  }

  if (userQuery.isError || !user) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dash/customers" />}
          className="self-start"
        >
          <ArrowLeft className="size-4" />
          Müşterilere dön
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı bulunamadı</CardTitle>
            <CardDescription>
              Bu kullanıcı getirilemedi. Daha sonra tekrar deneyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => userQuery.refetch()}
            >
              <RefreshCcw className="size-4" />
              Tekrar dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = fullName(user);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dash/customers" />}
            className="self-start"
          >
            <ArrowLeft className="size-4" />
            Müşterilere dön
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar size="lg" className="size-12">
              <AvatarFallback className="text-base">
                {initials(user)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {name}
                </h1>
                <UserStatusBadge status={user.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.email ?? "E-posta yok"} · #{user.userId}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => userQuery.refetch()}
            disabled={userQuery.isFetching}
          >
            <RefreshCcw
              className={cn(
                "size-4",
                userQuery.isFetching && "animate-spin",
              )}
            />
            Yenile
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Kullanıcıyı Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                Kişisel Bilgiler
              </CardTitle>
              <CardDescription>
                Kullanıcının temel profil bilgileri.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoRow
                icon={UserIcon}
                label="Ad"
                value={user.firstName}
              />
              <InfoRow
                icon={UserIcon}
                label="Soyad"
                value={user.lastName}
              />
              <InfoRow
                icon={Mail}
                label="E-posta"
                value={user.email}
              />
              <InfoRow
                icon={Phone}
                label="Telefon"
                value={user.phone}
              />
              <InfoRow
                icon={ShieldCheck}
                label="Rol"
                value={getUserRoleLabel(user.roleId)}
              />
              <InfoRow
                icon={user.emailConfirmed ? MailCheck : MailX}
                label="E-posta Doğrulama"
                value={user.emailConfirmed ? "Doğrulandı" : "Beklemede"}
                valueClassName={
                  user.emailConfirmed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                Hesap Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <SummaryRow
                label="Kullanıcı ID"
                value={`#${user.userId}`}
              />
              <SummaryRow
                label="Durum"
                value={<UserStatusBadge status={user.status} />}
              />
              <SummaryRow
                label="Rol"
                value={getUserRoleLabel(user.roleId)}
              />
              <SummaryRow
                label="E-posta Doğrulama"
                value={user.emailConfirmed ? "Doğrulandı" : "Beklemede"}
              />
              <Separator className="my-2" />
              <SummaryRow
                label="Kayıt Tarihi"
                value={formatDate(user.createdDate)}
              />
              <SummaryRow
                label="Son Güncelleme"
                value={formatDate(user.modifiedDate)}
              />
              {user.deletedDate && (
                <SummaryRow
                  label="Silinme Tarihi"
                  value={formatDate(user.deletedDate)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="size-4 text-muted-foreground" />
                Teknik Bilgiler
              </CardTitle>
              <CardDescription>
                Son oturum açılan IP adresi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow
                icon={Globe2}
                label="IP Adresi"
                value={user.ip}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={user}
        onDeleted={() => router.push("/dash/customers")}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  const display =
    typeof value === "string" ? (value.trim() ? value : "—") : value;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "text-sm font-medium text-foreground",
            valueClassName,
          )}
        >
          {display}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3.5 w-40" />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Kullanıcı yükleniyor...
      </div>
    </div>
  );
}