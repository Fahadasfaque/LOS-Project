'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import {
  Users,
  History,
  LayoutDashboard,
  FilePlus,
  Files,
  FileSearch,
  CheckSquare,
  LogOut,
  User,
  ShieldAlert,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const navigationGroups: SidebarGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
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
        icon: <FilePlus className="h-4 w-4" />,
        roles: ['LOAN_OFFICER'],
      },
      {
        title: 'My Applications',
        href: '/dashboard/my-applications',
        icon: <Files className="h-4 w-4" />,
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
        icon: <FileSearch className="h-4 w-4" />,
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
        icon: <CheckSquare className="h-4 w-4" />,
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
        icon: <Users className="h-4 w-4" />,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Audit Logs',
        href: '/dashboard/logs',
        icon: <History className="h-4 w-4" />,
        roles: ['SUPER_ADMIN'],
      }
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-t-primary border-r-primary border-border animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine if user can view this page (simple RBAC validation for client routing)
  const allItems = navigationGroups.flatMap(g => g.items);
  const currentItem = allItems.find((item) => item.href === pathname);
  if (currentItem && !currentItem.roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold mb-2">403 - Access Denied</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your profile role ({user.role}) does not have permission to view this section.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-md text-sm font-semibold transition-all">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col shrink-0 shadow-sm z-10">
        {/* Sidebar Header (Compact) */}
        <div className="flex items-center justify-center py-4 border-b border-sidebar-border h-16 shrink-0">
          <Link href="/dashboard" className="flex items-center justify-center dark:bg-white dark:p-1 dark:rounded-md transition-colors w-10/12" title="Fortress Banking">
            <Image src="/image.png" alt="Fortress Banking Logo" width={300} height={200} className="object-contain w-auto" priority />
          </Link>
        </div>

        {/* Sidebar Items */}
        <nav className="flex flex-col flex-1 overflow-y-auto py-4 px-4 custom-scrollbar">
          {navigationGroups.map((group, idx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="mb-6 last:mb-0">
                <div className="px-3 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                    {group.title}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center shrink-0 w-5 h-5 transition-colors ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground'}`}>
                            {item.icon}
                          </span>
                          {item.title}
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 opacity-70" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer removed per enterprise requirements */}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120]">
        {/* Top Navbar replaced by Enterprise Header */}
        <Header />

        {/* Panel Main Area */}
        <main className="flex-1 overflow-y-auto transition-colors duration-200 scroll-smooth">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>

        {/* Enterprise Footer */}
        <Footer />
      </div>
    </div>
  );
}
