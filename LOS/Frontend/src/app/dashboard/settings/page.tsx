'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { AppearanceTab } from '@/components/settings/AppearanceTab';
import {
  UserIcon,
  ShieldIcon,
  BellIcon,
  PaletteIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'security' | 'notifications' | 'appearance';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: UserIcon   },
  { id: 'security',      label: 'Security',      icon: ShieldIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon   },
  { id: 'appearance',    label: 'Appearance',    icon: PaletteIcon},
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  if (!user) return null;

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Manage your account, security, and preferences
      </p>

      <div className="flex gap-8">
        {/* ── Left Tab Nav ─────────────────────────────────────────────── */}
        <nav className="w-44 shrink-0" aria-label="Settings sections">
          <ul className="flex flex-col gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  id={`settings-tab-${id}`}
                  onClick={() => setActiveTab(id)}
                  aria-current={activeTab === id ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-100',
                    activeTab === id
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground font-normal'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile'       && <ProfileTab />}
          {activeTab === 'security'      && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'appearance'    && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
}
