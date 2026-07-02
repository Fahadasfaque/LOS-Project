'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEMES = [
  { value: 'light',  label: 'Light',  icon: SunIcon,     desc: 'Classic bright interface'      },
  { value: 'dark',   label: 'Dark',   icon: MoonIcon,    desc: 'Easy on the eyes at night'     },
  { value: 'system', label: 'System', icon: MonitorIcon, desc: 'Follows your OS preference'    },
] as const;

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the LOS platform looks on your device
        </p>
      </div>

      <div className="border-t" />

      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(({ value, label, icon: Icon, desc }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              id={`theme-${value}`}
              onClick={() => setTheme(value)}
              aria-pressed={active}
              className={cn(
                'relative flex flex-col items-center gap-2.5 rounded-lg border-2 px-3 py-5 text-center transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-foreground bg-accent'
                  : 'border-border hover:bg-accent/60'
              )}
            >
              <Icon className={cn('h-6 w-6', active ? 'text-foreground' : 'text-muted-foreground')} />
              <span className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
              {active && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground">
                  <CheckIcon className="h-2.5 w-2.5 text-background" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Your preference is saved locally and applied immediately.
      </p>
    </div>
  );
}
