'use client';

import { useEffect } from 'react';
import { useAI } from './AIProvider';
import { AIHeader } from './AIHeader';
import { AIConversation } from './AIConversation';
import { AIInput } from './AIInput';

export function AIFullscreen() {
  const { mode, close } = useAI();

  // Close on Escape
  useEffect(() => {
    if (mode !== 'fullscreen') return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mode, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (mode === 'fullscreen') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mode]);

  if (mode !== 'fullscreen') return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(3, 7, 18, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'aiFsBdIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      />

      <style>{`
        @keyframes aiFsBdIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes aiFsIn {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Fortress AI — Fullscreen"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92vw',
          height: '88vh',
          maxWidth: '1200px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.06)',
          animation: 'aiFsIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
        className="bg-white dark:bg-[#0b0f19] border border-slate-200/50 dark:border-slate-800/60"
      >
        {/* ── Header ── */}
        <AIHeader showExpand compact={false} />

        {/* ── Body: main chat area only (no sidebar) ── */}
        <div className="flex flex-1 min-h-0 bg-slate-50/50 dark:bg-slate-950/20">
          {/* Main chat area with Grid Dot background pattern */}
          <div
            className="flex-1 flex flex-col min-w-0 min-h-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.06) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            }}
          >
            <AIConversation compact={false} />

            {/* Input */}
            <AIInput />

            {/* Disclaimer Bar (full-width dark bar at the bottom) */}
            <div className="flex items-center gap-1.5 bg-black/25 dark:bg-black/40 pt-1.5 pb-6 px-3.5 select-none shrink-0 border-t border-white/[0.04]">
              <svg className="w-[11px] h-[11px] text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-[11px] text-white/60 dark:text-slate-400 leading-normal font-semibold">
                AI responses are informational and do not constitute final lending decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
