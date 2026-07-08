"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CircleHelp,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  User,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainNav: NavItem[] = [
  { title: "Genel Bakış", href: "/dash", icon: LayoutDashboard },
  { title: "Ürünler", href: "/dash/products", icon: Package },
  { title: "Kategoriler", href: "/dash/categories", icon: FolderTree },
  { title: "Hakkımızda", href: "/dash/about", icon: BookOpen },
  { title: "SSS", href: "/dash/sss", icon: CircleHelp },
  { title: "Mağaza Profili", href: "/dash/business-profile", icon: Store },
  { title: "Mağaza", href: "/dash/store", icon: Settings },
  { title: "Siparişler", href: "/dash/orders", icon: ShoppingCart },
  { title: "Müşteriler", href: "/dash/customers", icon: Users },
  { title: "Raporlar", href: "/dash/analytics", icon: BarChart3 },
];

const accountNav: NavItem[] = [
  { title: "Profil", href: "/dash/profile", icon: User },
  { title: "Ayarlar", href: "/dash/settings", icon: Settings },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/dash") return pathname === "/dash";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isItemActive(pathname, item.href)}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Mini Pazar"
              render={<Link href="/dash" />}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Store className="size-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-heading text-sm font-semibold tracking-tight">
                  Mini Pazar
                </span>
                <span className="text-xs text-muted-foreground">
                  Mağaza Paneli
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Menü" items={mainNav} />
        <NavGroup label="Hesap" items={accountNav} />
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Mini Pazar v1.0
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
