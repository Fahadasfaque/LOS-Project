'use client';

import React from 'react';
import { Database, Server, CheckCircle2 } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex items-center justify-between bg-surface border-t border-border px-6 py-3 text-xs text-muted-foreground shrink-0 z-20">
      
      {/* Left Section: Platform Info & Copyright */}
      <div className="flex items-center gap-4">
        <span className="font-semibold text-foreground">LOS Enterprise Platform</span>
        <div className="w-px h-3 bg-border hidden sm:block"></div>
        <span className="hidden sm:inline-block">v2.4.1 (Build 2026.06.25)</span>
        <div className="w-px h-3 bg-border hidden md:block"></div>
        <span className="hidden md:inline-block">&copy; {currentYear} Fortress Banking. All rights reserved.</span>
      </div>

      {/* Right Section: System Status */}
      <div className="flex items-center gap-4">
        
        {/* Environment Badge */}
        <span className="hidden sm:inline-block font-mono tracking-wider">ENV: DEV</span>
        
        <div className="w-px h-3 bg-border hidden sm:block"></div>

        {/* Backend Status */}
        <div className="flex items-center gap-1.5" title="Backend Connection: Healthy">
          <Server className="h-3 w-3 text-success" />
          <span className="hidden lg:inline-block">API Online</span>
        </div>

        <div className="w-px h-3 bg-border hidden sm:block"></div>

        {/* Database Status */}
        <div className="flex items-center gap-1.5" title="Database Connection: Connected">
          <Database className="h-3 w-3 text-success" />
          <span className="hidden lg:inline-block">DB Connected</span>
        </div>

      </div>
    </footer>
  );
}
