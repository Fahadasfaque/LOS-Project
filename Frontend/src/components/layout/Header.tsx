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
    const baseBtnClass = "hidden sm:flex gap-2 cursor-pointer font-semibold text-xs transition-all duration-150 active:scale-[0.98] hover:scale-[1.02] shadow-sm";
    switch (user.role) {
      case 'LOAN_OFFICER':
        return (
          <Button 
            onClick={() => router.push('/dashboard/create-application')} 
            size="sm" 
            className={`${baseBtnClass} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/10 h-10 px-4 rounded-lg`}
          >
            <FilePlus className="h-4.5 w-4.5" weight="bold" />
            New Application
          </Button>
        );
      case 'CREDIT_ANALYST':
        return (
          <Button 
            onClick={() => router.push('/dashboard/risk-queue')} 
            size="sm" 
            className={`${baseBtnClass} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/10 h-10 px-4 rounded-lg`}
          >
            <FileMagnifyingGlass className="h-4.5 w-4.5" weight="bold" />
            New Assessment
          </Button>
        );
      case 'APPROVER':
        return (
          <Button 
            onClick={() => router.push('/dashboard/approval-queue')} 
            size="sm" 
            className={`${baseBtnClass} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/10 h-10 px-4 rounded-lg`}
          >
            <CheckSquare className="h-4.5 w-4.5" weight="bold" />
            Generate Offer
          </Button>
        );
      case 'SUPER_ADMIN':
        return (
          <Button 
            onClick={() => router.push('/dashboard/users')} 
            size="sm" 
            className={`${baseBtnClass} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/10 h-10 px-4 rounded-lg`}
          >
            <UserPlus className="h-4.5 w-4.5" weight="bold" />
            Create User
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-6 h-16 shrink-0 transition-colors duration-200 sticky top-0 z-30 shadow-sm text-slate-900 dark:text-slate-50">
      {/* Left Section: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="h-9 w-9 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg border border-slate-200/50 dark:border-slate-800/50" />

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <CaretRight className="h-3 w-3 mx-1 opacity-55 text-slate-400" weight="bold" />}
              {crumb.isLast ? (
                <span className="text-slate-900 dark:text-white capitalize font-bold">{crumb.title}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-slate-900 dark:hover:text-white capitalize transition-colors">
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
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search applications..."
            className="h-9 w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white font-medium placeholder-slate-400/80"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-100">
            <span>Ctrl</span>/
          </kbd>
        </div>

        {/* Quick Action Button */}
        {getQuickAction()}

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1"></div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800/50"
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
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none border border-transparent">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-blue-200/50 dark:border-blue-900/50">
              {user.firstName.charAt(0)}{user.lastName ? user.lastName.charAt(0) : ''}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-400 leading-none mt-1">{user.role.replace('_', ' ')}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 font-medium" onClick={logout}>
              <SignOut className="mr-2 h-4 w-4" weight="bold" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
