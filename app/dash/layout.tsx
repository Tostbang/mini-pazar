import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./_components/app-sidebar";
import { NavUser } from "./_components/nav-user";
import { Breadcrumb } from "./_components/breadcrumb";
import { DashProviders } from "./_components/dash-providers";

export default function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashProviders>
      <SidebarProvider data-theme="dashboard">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb />
            <div className="ml-auto">
              <NavUser />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashProviders>
  );
}
