'use client';

/**
 * @file layout.tsx (Customer Portal)
 * @description Root layout for all /customer/* routes.
 *
 * ISOLATION: This layout is completely separate from the employee DashboardLayout.
 * It uses:
 *   - CustomerSidebar (not AppSidebar)
 *   - CustomerHeader (not Header)
 *   - CUSTOMER role guard (redirects to /customer/login if not CUSTOMER)
 *
 * Fetches unread notification count at layout level so both header bell
 * and sidebar badge stay in sync without prop drilling.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import api from '@/services/api';

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAppNumber, setLatestAppNumber] = useState<string | undefined>(undefined);

  const isPreAuthPage = pathname === '/customer/login' || pathname === '/customer/set-password';

  // RBAC guard: must be authenticated CUSTOMER
  useEffect(() => {
    if (!loading) {
      if (isPreAuthPage) {
        // If customer is already logged in, redirect away from login page
        if (user && user.role === 'CUSTOMER' && user.inviteStatus !== 'INVITED') {
          router.replace('/customer/dashboard');
        }
      } else {
        if (!user) {
          router.replace('/customer/login');
        } else if (user.role !== 'CUSTOMER') {
          // Employee accidentally hit /customer route — redirect to employee dashboard
          router.replace('/dashboard');
        }
      }
    }
  }, [user, loading, router, isPreAuthPage]);

  // Fetch notification badge count
  const refreshBadge = useCallback(async () => {
    try {
      const res = await api.get('/customer/notifications');
      if (res.success && Array.isArray(res.data)) {
        const unread = res.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  // Fetch latest application number for profile display
  const fetchAppNumber = useCallback(async () => {
    try {
      const res = await api.get('/customer/applications');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setLatestAppNumber(res.data[0].applicationNumber);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'CUSTOMER' && !isPreAuthPage) {
      refreshBadge();
      fetchAppNumber();
      // Poll every 60 seconds for new notifications
      const interval = setInterval(refreshBadge, 60_000);
      return () => clearInterval(interval);
    }
  }, [user, refreshBadge, fetchAppNumber, isPreAuthPage]);

  // If it's a login or setup page, render page directly without layout wrapper
  if (isPreAuthPage) {
    return <>{children}</>;
  }

  // While auth is loading or redirecting, show loading screen
  if (loading || !user || user.role !== 'CUSTOMER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-t-primary border-r-primary border-border animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <CustomerSidebar unreadCount={unreadCount} />
      <SidebarInset>
        <CustomerHeader unreadCount={unreadCount} applicationNumber={latestAppNumber} />
        <main className="flex flex-1 flex-col p-4 md:p-6 w-full overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
