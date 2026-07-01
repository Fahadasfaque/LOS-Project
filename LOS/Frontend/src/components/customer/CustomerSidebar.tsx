'use client';

/**
 * @file CustomerSidebar.tsx
 * @description Dedicated navigation sidebar for the Customer Self-Service Portal.
 *
 * Completely separate from the employee AppSidebar.
 * Navigation: Dashboard, My Application, Documents, My Offer, Notifications, Profile.
 * Shows unread notification badge on Notifications link.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  House,
  FileText,
  Folder,
  Gift,
  Bell,
  User,
  Shield,
  SignOut,
} from '@phosphor-icons/react';

const NAV_ITEMS = [
  {
    href: '/customer/dashboard',
    icon: House,
    label: 'Dashboard',
    description: 'Overview & Action Center',
  },
  {
    href: '/customer/applications',
    icon: FileText,
    label: 'My Application',
    description: 'Application details & timeline',
  },
  {
    href: '/customer/documents',
    icon: Folder,
    label: 'Documents',
    description: 'Upload & manage documents',
  },
  {
    href: '/customer/offers',
    icon: Gift,
    label: 'My Offer',
    description: 'Review & accept loan offer',
  },
  {
    href: '/customer/notifications',
    icon: Bell,
    label: 'Notifications',
    description: 'Activity & updates',
    showBadge: true,
  },
  {
    href: '/customer/profile',
    icon: User,
    label: 'Profile',
    description: 'Personal information',
  },
];

interface CustomerSidebarProps {
  unreadCount?: number;
}

export default function CustomerSidebar({ unreadCount = 0 }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-background min-h-screen">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border select-none">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-muted flex-shrink-0">
          <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">Fortress Banking</p>
          <p className="text-[10px] text-muted-foreground font-medium">Customer Portal</p>
        </div>
      </div>

      {/* Customer Identity */}
      {user && (
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/customer/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
                weight={isActive ? 'fill' : 'regular'}
              />
              <span className="flex-1 text-xs">{item.label}</span>

              {/* Unread notification badge */}
              {item.showBadge && unreadCount > 0 && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Sign out */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer border border-transparent hover:border-destructive/20"
        >
          <SignOut className="h-4 w-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>

        <p className="text-[9px] text-muted-foreground/50 text-center mt-3 select-none">
          © {new Date().getFullYear()} Fortress Banking
        </p>
      </div>
    </aside>
  );
}
