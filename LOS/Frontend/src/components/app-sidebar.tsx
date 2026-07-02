"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth, UserRole } from "@/context/AuthContext"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  FilePlusIcon,
  ListIcon,
  SearchIcon,
  CheckSquareIcon,
  UsersIcon,
  ClockIcon,
  ShieldIcon,
  SettingsIcon,
  LifeBuoyIcon,
} from "lucide-react"

interface SidebarItem {
  title: string
  url: string
  icon: React.ReactNode
  roles: UserRole[]
}

interface SidebarGroupType {
  label: string
  items: SidebarItem[]
}

const navigationGroups: SidebarGroupType[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
        roles: ["SUPER_ADMIN", "LOAN_OFFICER", "CREDIT_ANALYST", "APPROVER"],
      },
    ],
  },
  {
    label: "Loan Management",
    items: [
      {
        title: "New Application",
        url: "/dashboard/create-application",
        icon: <FilePlusIcon />,
        roles: ["LOAN_OFFICER"],
      },
      {
        title: "Applications",
        url: "/dashboard/applications",
        icon: <ListIcon />,
        roles: ["LOAN_OFFICER"],
      },
    ],
  },
  {
    label: "Credit Operations",
    items: [
      {
        title: "Risk Queue",
        url: "/dashboard/risk-queue",
        icon: <SearchIcon />,
        roles: ["CREDIT_ANALYST"],
      },
    ],
  },
  {
    label: "Approvals",
    items: [
      {
        title: "Approval Queue",
        url: "/dashboard/approval-queue",
        icon: <CheckSquareIcon />,
        roles: ["APPROVER"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: <UsersIcon />,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Audit Logs",
        url: "/dashboard/logs",
        icon: <ClockIcon />,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
]

const navSecondary = [
  { title: "Settings", url: "/dashboard/settings", icon: <SettingsIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  if (!user) return null

  // Map LOS user to NavUser expected structure
  const navUserData = {
    name: `${user.firstName} ${user.lastName || ""}`.trim(),
    email: user.role.replace("_", " "),
    avatar: "", // Will use fallback initials in NavUser
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ShieldIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">FORTRESS LENDING</span>
                <span className="truncate text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Origination
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigationGroups.map((group) => {
          const filteredItems = group.items.filter((item) =>
            item.roles.includes(user.role)
          )
          if (filteredItems.length === 0) return null

          return (
            <NavMain
              key={group.label}
              items={filteredItems}
              label={group.label}
            />
          )
        })}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUserData} />
      </SidebarFooter>
    </Sidebar>
  )
}
