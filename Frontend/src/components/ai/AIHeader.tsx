'use client';

import React from 'react';
import { ArrowsOutIcon, MinusIcon, XIcon, PlusIcon } from '@phosphor-icons/react';
import { useAI } from './AIProvider';
import type { AIMode, AIStatus } from './AIProvider';

interface AIHeaderProps {
  showExpand?: boolean;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  compact?: boolean;
}

const MODES: { value: AIMode; label: string; iconSvg: React.ReactNode }[] = [
  {
    value: 'general',
    label: 'General',
    iconSvg: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1"/>
        <rect x="14" y="3" width="7" height="5" rx="1"/>
        <rect x="14" y="12" width="7" height="9" rx="1"/>
        <rect x="3" y="16" width="7" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    value: 'advisor',
    label: 'Loan Advisor',
    iconSvg: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    value: 'emi',
    label: 'EMI Calc',
    iconSvg: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
        <line x1="9" y1="9" x2="15" y2="9"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    ),
  },
  {
    value: 'policy',
    label: 'Policies',
    iconSvg: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    value: 'tracker',
    label: 'Tracker',
    iconSvg: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
];

const STATUS_CONFIG: Record<AIStatus, { label: string; color: string }> = {
  ready:      { label: 'Ready',      color: 'bg-emerald-500' },
  responding: { label: 'Responding', color: 'bg-blue-500 animate-pulse' },
  processing: { label: 'Processing', color: 'bg-amber-500 animate-pulse' },
  offline:    { label: 'Offline',    color: 'bg-slate-400' },
};

export function AIHeader({
  showExpand = true,
  compact = false,
}: AIHeaderProps) {
  const { close, expand, collapse, mode, newConversation, status, activeMode, setActiveMode } = useAI();

  const currentStatus = STATUS_CONFIG[status] || STATUS_CONFIG.ready;

  return (
    <div className="shrink-0 flex flex-col bg-[#0d1f40] select-none font-sans pt-3.5 px-4">
      {/* Primary Header Row */}
      <div className="flex items-center justify-between pb-3">
        {/* Brand info */}
        <div className="flex items-center gap-2.5">
          {/* Avatar (36x36, border-radius 9px, bg blue-accent, check shield SVG inside) */}
          <div className="w-9 h-9 rounded-[9px] bg-[#2563eb] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" strokeWidth="2.5"/>
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="brand-title text-[15px] font-bold text-white tracking-tight leading-none">Fortress AI</span>
              {/* Secure Badge (rgba green bg, solid green border, uppercase 10px text) */}
              <div className="secure-badge flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded px-1.5 py-0.5 select-none">
                <div className="w-1.2 h-1.2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-emerald-500 text-[10px] font-bold tracking-wider uppercase leading-none">Secure</span>
              </div>
            </div>
            <p className="brand-subtitle text-[11px] text-white/50 leading-none mt-1.5 font-normal">Enterprise Banking Assistant</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5">
          {/* Status Label */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.8 rounded-full bg-white/5 border border-white/10 text-[9px] font-semibold text-slate-350 mr-1.5 select-none">
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`} />
            {currentStatus.label}
          </div>

          {/* New chat */}
          <HeaderBtn onClick={() => newConversation()} title="New conversation">
            <PlusIcon weight="bold" className="w-3.5 h-3.5" />
          </HeaderBtn>

          {/* Expand / Collapse */}
          {showExpand && (
            mode === 'fullscreen' ? (
              <HeaderBtn onClick={collapse} title="Exit fullscreen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                  <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
                </svg>
              </HeaderBtn>
            ) : (
              <HeaderBtn onClick={expand} title="Expand to fullscreen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </HeaderBtn>
            )
          )}

          {/* Minimize (widget only) */ }

          {/* Close */}
          <HeaderBtn onClick={close} title="Close" isClose>
            <XIcon weight="bold" className="w-3.5 h-3.5" />
          </HeaderBtn>
        </div>
      </div>

      {/* Mode Tabs Row (matches template tabs exactly: active has blue bottom border, light blue active bg, rounded-t-md) */}
      <div className="flex items-end gap-[2px] overflow-x-auto scrollbar-none h-9 mt-1 -mx-4 px-4 border-t border-white/[0.04]">
        {MODES.map(m => {
          const isActive = activeMode === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setActiveMode(m.value)}
              className={`
                shrink-0 flex items-center gap-[5px] px-3 h-full text-[12px] font-medium tracking-wide whitespace-nowrap transition-none cursor-pointer border-b-2
                ${isActive
                  ? 'text-white border-blue-500 bg-blue-600/10 rounded-t-md'
                  : 'text-white/45 border-transparent hover:text-white'
                }
              `}
            >
              <span className="shrink-0 w-[13px] h-[13px] flex items-center justify-center">{m.iconSvg}</span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HeaderBtn({
  onClick,
  title,
  children,
  isClose = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  isClose?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer bg-transparent hover:bg-white/5 ${
        isClose ? 'text-white/70 hover:text-white' : 'text-white/50 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  );
}
