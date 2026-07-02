"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Gift,
  Bell,
  User,
  Shield,
} from "lucide-react"

interface CustomerSidebarProps extends React.ComponentProps<typeof Sidebar> {
  unreadCount?: number
}

const navGroups = [
  {
    label: "My Account",
    items: [
      { title: "Dashboard", url: "/customer/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Loan Journey",
    items: [
      { title: "My Application", url: "/customer/applications", icon: FileText },
      { title: "Documents", url: "/customer/documents", icon: FolderOpen },
      { title: "My Offer", url: "/customer/offers", icon: Gift },
    ],
  },
  {
    label: "Settings & Support",
    items: [
      { title: "Notifications", url: "/customer/notifications", icon: Bell },
      { title: "Profile", url: "/customer/profile", icon: User },
    ],
  },
]

export default function CustomerSidebar({ unreadCount = 0, ...props }: CustomerSidebarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const navUserData = {
    name: user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Customer",
    email: user?.email || "customer@example.com",
    avatar: "",
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/customer/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Shield className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">FORTRESS BANKING</span>
                <span className="truncate text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Customer Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                const isNotifications = item.url === "/customer/notifications"
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {isNotifications && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={navUserData} />
      </SidebarFooter>
    </Sidebar>
  )
}
