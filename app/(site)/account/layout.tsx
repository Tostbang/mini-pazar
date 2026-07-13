import { Section } from "@/components/section";
import { AccountSidebar } from "./_components/account-sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background pb-16 max-w-[1320px] mx-auto">
      <Section className="pt-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AccountSidebar />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </Section>
    </main>
  );
}
