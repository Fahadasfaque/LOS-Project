'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
        {/* Modern Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/40">
          {/* Header containing Breadcrumbs & Actions */}
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
    </SidebarProvider>
  );
}
