'use client';

/**
 * @file CustomerHeader.tsx
 * @description Dedicated header for the Customer Self-Service Portal.
 *
 * Completely separate from the employee Header.tsx.
 * Displays: Brand logo, Help dropdown (FAQ), Notification bell with unread count,
 * Profile dropdown (name, application number, logout), Theme toggle.
 *
 * NO: search, role selector, environment badges, breadcrumbs.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import {
  Shield,
  Bell,
  User,
  Question,
  SignOut,
  Sun,
  Moon,
  Phone,
  Envelope,
  ChatCircle,
  BookOpen,
  Calculator,
  X,
} from '@phosphor-icons/react';

interface CustomerHeaderProps {
  unreadCount?: number;
  applicationNumber?: string;
}

export default function CustomerHeader({ unreadCount = 0, applicationNumber }: CustomerHeaderProps) {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">

        {/* ── Left: Brand ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 select-none">
          
          <div>
            <p className="text-sm font-bold text-foreground leading-none">Fortress Banking</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">Customer Portal</p>
          </div>
        </div>

        {/* ── Right: Actions ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1">

          {/* Help / FAQ Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setHelpOpen(!helpOpen); setProfileOpen(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Help & Support"
            >
              <Question className="h-4 w-4" />
            </button>

            {helpOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">Help & Support</p>
                      <button onClick={() => setHelpOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">How can we help you today?</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <HelpItem icon={<BookOpen className="h-3.5 w-3.5" />} label="How to upload documents" desc="Step-by-step guide for document submission" />
                    <HelpItem icon={<Calculator className="h-3.5 w-3.5" />} label="How EMI is calculated" desc="Understand your monthly repayment breakdown" />
                    <HelpItem icon={<ChatCircle className="h-3.5 w-3.5" />} label="Contact your Loan Officer" desc="Message or call your assigned officer" />
                  </div>
                  <div className="p-3 border-t border-border space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Direct Support</p>
                    <a href="mailto:support@fortressbanking.com" className="flex items-center gap-2.5 text-xs text-foreground hover:text-primary transition-colors py-1">
                      <Envelope className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>support@fortressbanking.com</span>
                    </a>
                    <a href="tel:18001234567" className="flex items-center gap-2.5 text-xs text-foreground hover:text-primary transition-colors py-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>1800-123-4567 (Toll Free)</span>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <a
            href="/customer/notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </a>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setHelpOpen(false); }}
              className="flex items-center gap-2 h-8 px-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground hidden sm:block">
                {user?.firstName}
              </span>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 border-b border-border">
                    <p className="text-xs font-bold text-foreground">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user?.email}</p>
                    {applicationNumber && (
                      <p className="text-[10px] text-primary font-mono mt-1">{applicationNumber}</p>
                    )}
                  </div>
                  <div className="p-2">
                    <a
                      href="/customer/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      My Profile
                    </a>
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer mt-1"
                    >
                      <SignOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HelpItem({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <button className="flex items-start gap-2.5 w-full px-2 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="mt-0.5 text-primary/70 group-hover:text-primary transition-colors">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}
