'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Bell,
  Moon,
  Sun,
  SignOut,
  User,
  CaretRight,
  FilePlus,
  FileMagnifyingGlass,
  CheckSquare,
  UserPlus
} from '@phosphor-icons/react';
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
import { SidebarTrigger } from '@/components/ui/sidebar';

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
            <FilePlus className="h-4 w-4" weight="bold" />
            New Application
          </Button>
        );
      case 'CREDIT_ANALYST':
        return (
          <Button onClick={() => router.push('/dashboard/risk-queue')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <FileMagnifyingGlass className="h-4 w-4" weight="bold" />
            New Assessment
          </Button>
        );
      case 'APPROVER':
        return (
          <Button onClick={() => router.push('/dashboard/approval-queue')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <CheckSquare className="h-4 w-4" weight="bold" />
            Generate Offer
          </Button>
        );
      case 'SUPER_ADMIN':
        return (
          <Button onClick={() => router.push('/dashboard/users')} size="sm" className="hidden sm:flex gap-2 cursor-pointer">
            <UserPlus className="h-4 w-4" weight="bold" />
            Create User
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="flex items-center justify-between bg-card border-b border-border px-6 h-16 shrink-0 transition-colors duration-200 sticky top-0 z-30 shadow-sm text-card-foreground">
      {/* Left Section: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer rounded" />

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-muted-foreground select-none">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <CaretRight className="h-3.5 w-3.5 mx-1 opacity-55 text-muted-foreground" weight="bold" />}
              {crumb.isLast ? (
                <span className="text-foreground capitalize font-bold">{crumb.title}</span>
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
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search applications..."
            className="h-9 w-64 bg-background border border-border rounded pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all text-foreground font-medium"
          />
        </div>

        {/* Quick Action Button */}
        {getQuickAction()}

        <div className="w-px h-5 bg-border hidden sm:block mx-1"></div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors cursor-pointer"
          title="Toggle theme"
        >
          {mounted ? (
            resolvedTheme === 'dark' ? <Sun className="h-5 w-5" weight="bold" /> : <Moon className="h-5 w-5" weight="bold" />
          ) : (
            <Moon className="h-5 w-5 opacity-0" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors cursor-pointer outline-none">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
              <User className="h-4.5 w-4.5" weight="bold" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-foreground">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground leading-none mt-1">{user.role.replace('_', ' ')}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium" onClick={logout}>
              <SignOut className="mr-2 h-4 w-4" weight="bold" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
