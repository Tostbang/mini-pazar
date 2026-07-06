"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  MailCheck,
  MailX,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationInfo,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/format";
import { DeleteUserDialog } from "./_components/delete-user-dialog";
import { UserStatusBadge } from "./_components/user-status-badge";
import { getUserRoleLabel } from "./_components/user-role-label";
import {
  useGetAllUsers,
  type AdminUser,
} from "./_services/queries";

const PAGE_SIZE = 10;
const ALL_FILTER = "all" as const;
const ACTIVE_FILTER = "active" as const;
const INACTIVE_FILTER = "inactive" as const;

type StatusFilter =
  | typeof ALL_FILTER
  | typeof ACTIVE_FILTER
  | typeof INACTIVE_FILTER;

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

function fullName(user: Pick<AdminUser, "firstName" | "lastName" | "email">) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "İsimsiz Kullanıcı";
}

function initials(user: Pick<AdminUser, "firstName" | "lastName" | "email">) {
  const name = fullName(user);
  if (!user.firstName && !user.lastName) {
    return (user.email ?? "?").slice(0, 2).toUpperCase();
  }
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

function statusFilterToBody(
  filter: StatusFilter,
  page: number,
): {
  status: boolean | null;
  page: number;
  pageSize: number;
} {
  return {
    status: filter === ALL_FILTER ? null : filter === ACTIVE_FILTER,
    page,
    pageSize: PAGE_SIZE,
  };
}

export default function CustomersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_FILTER);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);

  const requestBody = useMemo(
    () => statusFilterToBody(statusFilter, page),
    [statusFilter, page],
  );

  const usersQuery = useGetAllUsers(requestBody);

  const users = usersQuery.data?.users ?? [];
  const totalCount = usersQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, usersQuery.data?.totalPages ?? 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      return (
        (user.firstName ?? "").toLowerCase().includes(query) ||
        (user.lastName ?? "").toLowerCase().includes(query) ||
        (user.email ?? "").toLowerCase().includes(query) ||
        (user.phone ?? "").toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const onFilterChange = (value: string | null) => {
    if (value == null) return;
    if (
      value === ALL_FILTER ||
      value === ACTIVE_FILTER ||
      value === INACTIVE_FILTER
    ) {
      setStatusFilter(value);
      // Filtre değiştiğinde backend'in sayfalama metadata'sı ile
      // uyumsuz kalmamak için yerel sayfa state'ini 1'e çekiyoruz.
      setPage(1);
    }
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const openDelete = (user: AdminUser) => {
    setActiveUser(user);
    setDeleteOpen(true);
  };

  const onRefresh = () => usersQuery.refetch();

  const isInitialLoading = usersQuery.isLoading;
  const isFetching = usersQuery.isFetching;

  const filterLabel =
    statusFilter === ALL_FILTER
      ? "Tüm Durumlar"
      : statusFilter === ACTIVE_FILTER
        ? "Aktif"
        : "Pasif";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Müşteriler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kayıtlı kullanıcıları görüntüleyin, durumlarına göre filtreleyin
            ve hesaplarını yönetin.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Müşteri Listesi</CardTitle>
            <CardDescription>
              {isInitialLoading
                ? "Kullanıcılar yükleniyor..."
                : `Toplam ${totalCount} kullanıcı${
                    search.trim() ? ` · ${filteredUsers.length} eşleşme` : ""
                  }`}
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select
              value={statusFilter}
              onValueChange={onFilterChange}
            >
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue placeholder="Duruma göre filtrele">
                  {filterLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Tüm Durumlar</SelectItem>
                <SelectItem value={ACTIVE_FILTER}>Aktif</SelectItem>
                <SelectItem value={INACTIVE_FILTER}>Pasif</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Ad, e-posta veya telefon ile ara..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isInitialLoading ? (
            <UsersTableSkeleton />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              isFiltering={
                search.trim().length > 0 || statusFilter !== ALL_FILTER
              }
              onRefresh={onRefresh}
            />
          ) : (
            <UsersTable
              users={filteredUsers}
              fetching={isFetching}
              onDelete={openDelete}
            />
          )}
        </CardContent>
        {totalCount > 0 && !search.trim() && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <PaginationInfo
              page={safePage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
            />
            <div className="flex items-center gap-2">
              <PaginationPrevious
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <PaginationNext
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </Card>

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={activeUser}
      />
    </div>
  );
}

function UsersTable({
  users,
  fetching,
  onDelete,
}: {
  users: AdminUser[];
  fetching?: boolean;
  onDelete: (user: AdminUser) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Kullanıcı</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>E-posta Doğrulama</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Kayıt Tarihi</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody
        className={fetching ? "opacity-60 transition-opacity" : undefined}
      >
        {users.map((user) => {
          const name = fullName(user);
          const VerificationIcon = user.emailConfirmed ? MailCheck : MailX;
          return (
            <TableRow key={user.userId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="default">
                    <AvatarImage src={undefined} alt={name} />
                    <AvatarFallback>{initials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Link
                      href={`/dash/users/${user.userId}`}
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {name}
                    </Link>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {user.email ?? "—"}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.phone ?? "—"}
              </TableCell>
              <TableCell className="text-sm">
                {getUserRoleLabel(user.roleId)}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium",
                    user.emailConfirmed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  <VerificationIcon className="size-3.5" />
                  {user.emailConfirmed ? "Doğrulandı" : "Beklemede"}
                </span>
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(user.createdDate)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dash/users/${user.userId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    Detaylar
                    <ChevronRight className="size-4" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm">
                          <span className="sr-only">
                            {name} için işlem menüsünü aç
                          </span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={
                          <Link href={`/dash/users/${user.userId}`} />
                        }
                      >
                        <UserIcon className="size-4" />
                        Detayları Gör
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Kullanıcıyı Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function EmptyState({
  isFiltering,
  onRefresh,
}: {
  isFiltering: boolean;
  onRefresh: () => void;
}) {
  if (isFiltering) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Search className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Eşleşen kullanıcı bulunamadı
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Arama filtresini veya durum seçimini değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <UserIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Henüz müşteri yok
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Yeni kullanıcılar kayıt olduğunda burada listelenecek.
        </p>
      </div>
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCcw className="size-4" />
        Yenile
      </Button>
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Kullanıcı</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>E-posta Doğrulama</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Kayıt Tarihi</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-24" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto size-7 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}