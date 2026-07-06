import { Suspense } from "react";
import { VerifyEmailForm } from "./_components/verify-email-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
