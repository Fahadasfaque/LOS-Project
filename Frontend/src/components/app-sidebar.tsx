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
  SidebarRail,
  SidebarFooter
} from '@/components/ui/sidebar';
import {
  SquaresFour,
  FileText,
  List,
  MagnifyingGlass,
  CheckSquare,
  Users,
  ClockCounterClockwise,
  Shield,
  CaretDown
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
        icon: <SquaresFour className="size-4.5" weight="fill" />,
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
        icon: <FileText className="size-4.5" weight="fill" />,
        roles: ['LOAN_OFFICER'],
      },
      {
        title: 'My Applications',
        href: '/dashboard/my-applications',
        icon: <List className="size-4.5" weight="bold" />,
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
        icon: <MagnifyingGlass className="size-4.5" weight="fill" />,
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
        icon: <CheckSquare className="size-4.5" weight="fill" />,
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
        icon: <Users className="size-4.5" weight="fill" />,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Audit Logs',
        href: '/dashboard/logs',
        icon: <ClockCounterClockwise className="size-4.5" weight="fill" />,
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
      <SidebarHeader className="h-16 flex flex-row items-center gap-2.5 px-4 border-b border-sidebar-border select-none bg-sidebar">
        <Link href="/dashboard" className="flex items-center gap-2.5 w-full justify-start">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary shadow-sm">
            <Shield className="h-4.5 w-4.5 text-primary" weight="fill" />
          </div>
          <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold text-sm leading-none text-[#0b3a60] dark:text-[#0b3a60] tracking-tight">FORTRESS LENDING</span>
            <span className="text-[8px] text-muted-foreground uppercase font-extrabold tracking-wider leading-none mt-1">
              Origination Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-sidebar">
        {navigationGroups.map((group, idx) => {
          const filteredItems = group.items.filter(item => item.roles.includes(user.role));
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={idx} className="px-2">
              <SidebarGroupLabel className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden mb-1">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
                    return (
                      <SidebarMenuItem key={item.href} className="mb-0.5">
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-[#E8F1FC] text-[#0A58CA] dark:bg-blue-950/40 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
              {user.firstName.charAt(0)}{user.lastName ? user.lastName.charAt(0) : ''}
            </div>
            <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-bold text-foreground leading-none">{user.firstName} {user.lastName}</span>
              <span className="text-[9px] text-muted-foreground font-semibold mt-1 uppercase tracking-wider leading-none">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
          <CaretDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" weight="bold" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
