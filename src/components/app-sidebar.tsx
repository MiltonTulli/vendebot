"use client";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Users,
  Settings,
  Bot,
  History,
  FileText,
  Plug,
  Megaphone,
  BarChart3,
  Globe,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
  { title: "Pedidos", href: "/app/orders", icon: ShoppingCart },
  { title: "Catálogo", href: "/app/catalog", icon: Package },
  { title: "Conversaciones", href: "/app/conversations", icon: MessageSquare },
  { title: "Clientes", href: "/app/customers", icon: Users },
  { title: "Facturas", href: "/app/invoices", icon: FileText },
  { title: "Campañas", href: "/app/campaigns", icon: Megaphone },
  { title: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { title: "Landing Pages", href: "/app/seo", icon: Globe },
  { title: "Registro de cambios", href: "/app/change-log", icon: History },
  { title: "Integraciones", href: "/app/settings/integrations", icon: Plug },
  { title: "Facturación", href: "/app/billing", icon: CreditCard },
  { title: "Configuración", href: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/app" className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">VendéBot</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          VendéBot v0.1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
