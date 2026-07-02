"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BellIcon,
  HelpCircleIcon,
  XIcon,
  BookOpenIcon,
  CalculatorIcon,
  MessageCircleIcon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

interface CustomerHeaderProps {
  unreadCount?: number
  applicationNumber?: string
}

export default function CustomerHeader({ unreadCount = 0, applicationNumber }: CustomerHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background rounded-t-full">
      {/* Left side: Sidebar trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DynamicBreadcrumb />

        {/* App Number Context Badge */}
        {applicationNumber && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4 hidden sm:block" />
            <span className="hidden sm:flex items-center text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
              App: {applicationNumber}
            </span>
          </>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="ml-auto flex items-center gap-3 pr-4">
        {/* Help / FAQ */}
        <div className="relative">
          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            title="Help & Support"
          >
            <HelpCircleIcon className="h-4 w-4" />
          </button>

          {helpOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Help & Support</p>
                    <button onClick={() => setHelpOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">How can we help you today?</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <HelpItem icon={<BookOpenIcon className="h-3.5 w-3.5" />} label="How to upload documents" desc="Step-by-step guide for document submission" />
                  <HelpItem icon={<CalculatorIcon className="h-3.5 w-3.5" />} label="How EMI is calculated" desc="Understand your monthly repayment breakdown" />
                  <HelpItem icon={<MessageCircleIcon className="h-3.5 w-3.5" />} label="Contact your Loan Officer" desc="Message or call your assigned officer" />
                </div>
                <div className="p-3 border-t border-border space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Direct Support</p>
                  <a href="mailto:support@fortressbanking.com" className="flex items-center gap-2.5 text-xs text-foreground hover:text-primary transition-colors py-1">
                    <MailIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>support@fortressbanking.com</span>
                  </a>
                  <a href="tel:18001234567" className="flex items-center gap-2.5 text-xs text-foreground hover:text-primary transition-colors py-1">
                    <PhoneIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>1800-123-4567 (Toll Free)</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell */}
        <Link
          href="/customer/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Notifications"
        >
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  )
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
  )
}
