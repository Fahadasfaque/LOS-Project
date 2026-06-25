'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronRight,
  FilePlus,
  FileSearch,
  CheckSquare,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  // Breadcrumbs logic
  const pathSegments = pathname.split('/').filter(p => p !== '');
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSegments.length - 1;
    const title = segment.replace(/-/g, ' ');
    return { href, title, isLast };
  });

  // Role-based Quick Action
  const getQuickAction = () => {
    switch (user.role) {
      case 'LOAN_OFFICER':
        return (
          <Button onClick={() => router.push('/dashboard/create-application')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <FilePlus className="h-4 w-4" />
            New Application
          </Button>
        );
      case 'CREDIT_ANALYST':
        return (
          <Button onClick={() => router.push('/dashboard/risk-queue')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <FileSearch className="h-4 w-4" />
            New Assessment
          </Button>
        );
      case 'APPROVER':
        return (
          <Button onClick={() => router.push('/dashboard/approval-queue')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <CheckSquare className="h-4 w-4" />
            Generate Offer
          </Button>
        );
      case 'SUPER_ADMIN':
        return (
          <Button onClick={() => router.push('/dashboard/users')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="flex items-center justify-between bg-surface/95 backdrop-blur-md border-b border-border px-6 h-16 shrink-0 transition-colors duration-200 sticky top-0 z-30 shadow-sm">

      {/* Left Section: Breadcrumbs */}
      <div className="flex items-center gap-6">

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <ChevronRight className="h-4 w-4 mx-1 opacity-50" />}
              {crumb.isLast ? (
                <span className="text-foreground capitalize font-semibold">{crumb.title}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground capitalize transition-colors">
                  {crumb.title}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-4">

        {/* Global Search */}
        <div className="hidden lg:flex relative items-center">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search applications..."
            className="h-8 w-64 bg-muted/50 border border-border rounded-md pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all text-foreground"
          />
        </div>

        {/* Quick Action Button */}
        {getQuickAction()}

        {/* Environment Badge */}
        <span className="hidden sm:inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 border border-amber-500/20 uppercase tracking-widest">
          Development
        </span>

        <div className="w-px h-5 bg-border hidden sm:block mx-1"></div>

        {/* Notifications */}
        <button className="relative p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors cursor-pointer"
          title="Toggle theme"
        >
          {mounted ? (
            resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5 opacity-0" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors cursor-pointer outline-none">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
              <User className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground leading-none mt-1">{user.role.replace('_', ' ')}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
