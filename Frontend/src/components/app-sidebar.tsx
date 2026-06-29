'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
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
  SidebarRail
} from '@/components/ui/sidebar';
import {
  Gauge,
  FilePlus,
  Files,
  MagnifyingGlass,
  CheckSquare,
  Users,
  ClockCounterClockwise,
  Shield
} from '@phosphor-icons/react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

interface SidebarGroupType {
  title: string;
  items: SidebarItem[];
}

const navigationGroups: SidebarGroupType[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <Gauge className="size-4" />,
        roles: ['SUPER_ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'APPROVER'],
      }
    ]
  },
  {
    title: 'Loan Management',
    items: [
      {
        title: 'New Application',
        href: '/dashboard/create-application',
        icon: <FilePlus className="size-4" />,
        roles: ['LOAN_OFFICER'],
      },
      {
        title: 'My Applications',
        href: '/dashboard/my-applications',
        icon: <Files className="size-4" />,
        roles: ['LOAN_OFFICER'],
      }
    ]
  },
  {
    title: 'Credit Operations',
    items: [
      {
        title: 'Risk Queue',
        href: '/dashboard/risk-queue',
        icon: <MagnifyingGlass className="size-4" />,
        roles: ['CREDIT_ANALYST'],
      }
    ]
  },
  {
    title: 'Approvals',
    items: [
      {
        title: 'Approval Queue',
        href: '/dashboard/approval-queue',
        icon: <CheckSquare className="size-4" />,
        roles: ['APPROVER'],
      }
    ]
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Users',
        href: '/dashboard/users',
        icon: <Users className="size-4" />,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Audit Logs',
        href: '/dashboard/logs',
        icon: <ClockCounterClockwise className="size-4" />,
        roles: ['SUPER_ADMIN'],
      }
    ]
  }
];

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="h-16 flex flex-row items-center gap-2.5 px-4 border-b border-sidebar-border select-none">
        <Link href="/dashboard" className="flex items-center gap-2.5 w-full justify-start">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" weight="fill" />
          </div>
          <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold text-sm leading-tight text-foreground tracking-tight">Fortress Lending</span>
            <span className="text-[9px] text-muted-foreground uppercase font-extrabold tracking-wider leading-none mt-0.5">
              Origination Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {navigationGroups.map((group, idx) => {
          const filteredItems = group.items.filter(item => item.roles.includes(user.role));
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={idx}>
              <SidebarGroupLabel className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          render={
                            <Link href={item.href}>
                              {item.icon}
                              <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
