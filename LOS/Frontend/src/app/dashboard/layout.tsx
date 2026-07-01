'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/layout/Footer';
import { AppSidebar } from '@/components/app-sidebar';
import { CommandPalette } from '@/components/command-palette';
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  FilePlusIcon,
  SearchIcon,
  CheckSquareIcon,
  UserPlusIcon
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, mounted]);

  if (loading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors duration-200">
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

  // Role-based Quick Action
  const getQuickAction = () => {
    const baseBtnClass = "hidden sm:flex h-8 gap-1.5 cursor-pointer font-medium text-xs transition-all duration-150";
    switch (user.role) {
      case 'LOAN_OFFICER':
        return (
          <Button 
            onClick={() => router.push('/dashboard/create-application')} 
            size="sm" 
            className={baseBtnClass}
          >
            <FilePlusIcon className="h-3.5 w-3.5" />
            New Application
          </Button>
        );
      case 'CREDIT_ANALYST':
        return (
          <Button 
            onClick={() => router.push('/dashboard/risk-queue')} 
            size="sm" 
            className={baseBtnClass}
          >
            <SearchIcon className="h-3.5 w-3.5" />
            New Assessment
          </Button>
        );
      case 'APPROVER':
        return (
          <Button 
            onClick={() => router.push('/dashboard/approval-queue')} 
            size="sm" 
            className={baseBtnClass}
          >
            <CheckSquareIcon className="h-3.5 w-3.5" />
            Generate Offer
          </Button>
        );
      case 'SUPER_ADMIN':
        return (
          <Button 
            onClick={() => router.push('/dashboard/users')} 
            size="sm" 
            className={baseBtnClass}
          >
            <UserPlusIcon className="h-3.5 w-3.5" />
            Create User
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background rounded-t-full ">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <DynamicBreadcrumb />
          </div>
          <div className="ml-auto flex items-center gap-3 pr-4">
            {getQuickAction()}
            
            <Separator
              orientation="vertical"
              className="h-4 hidden sm:block"
            />

            <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
            <ThemeToggle />
          </div>
        </header>
        <CommandPalette />
        <main className="flex flex-1 flex-col p-4 md:p-6 w-full overflow-x-hidden">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
