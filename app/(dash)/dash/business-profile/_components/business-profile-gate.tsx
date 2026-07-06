"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import {
  useGetBusinessProfile,
  type BusinessProfile,
} from "../_services/queries";
import { BusinessProfileFormModal } from "./business-profile-form-modal";

/**
 * Decides whether the admin has filled out the business profile. Until they
 * have, the dashboard renders a blocking overlay + required dialog. The
 * overlay catches pointer events so the admin cannot interact with the rest
 * of the dashboard until the profile is saved.
 *
 * "Filled out" means a non-empty `shopName`, `businessType`, `address` and
 * `phone`. The backend returns these as nullable strings, so we check each
 * individually rather than just the presence of a profile object.
 */
export function BusinessProfileGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileQuery = useGetBusinessProfile();

  if (profileQuery.isLoading) {
    return <BlockingLoadingState />;
  }

  if (profileQuery.isError) {
    return <BlockingErrorState onRetry={() => profileQuery.refetch()} />;
  }

  const profile = profileQuery.data?.profile as BusinessProfile | null | undefined;
  const isComplete = isProfileComplete(profile);

  if (isComplete) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px]"
      />
      {children}
      <BusinessProfileFormModal
        open
        required
        profile={profile ?? null}
      />
    </>
  );
}

function isProfileComplete(profile: BusinessProfile | null | undefined) {
  if (!profile) return false;
  // The backend may return a profile object with an id and null fields. Treat
  // it as incomplete until each required string is non-empty.
  return Boolean(
    profile.shopName?.trim() &&
      profile.businessType?.trim() &&
      profile.address?.trim() &&
      profile.phone?.trim(),
  );
}

function BlockingLoadingState() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px]"
      />
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-lg">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Mağaza profili kontrol ediliyor...
          </p>
        </div>
      </div>
    </>
  );
}

function BlockingErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px]"
      />
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-lg">
          <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Mağaza profili yüklenemedi
            </p>
            <p className="text-xs text-muted-foreground">
              Bağlantınızı kontrol edip tekrar deneyin. Devam edebilmek için
              mağaza profilinize erişmemiz gerekiyor.
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    </>
  );
}