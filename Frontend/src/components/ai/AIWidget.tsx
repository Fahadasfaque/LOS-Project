'use client';

import { useAI } from './AIProvider';
import { AIHeader } from './AIHeader';
import { AIConversation } from './AIConversation';
import { AIInput } from './AIInput';

/**
 * Compact chat widget — 420px × 620px panel.
 * Visible when mode === 'widget'.
 */
export function AIWidget() {
  const { mode } = useAI();

  if (mode !== 'widget') return null;

  return (
    <>
      {/* Widget container (matches template chatbot-widget style exactly) */}
      <div
        role="dialog"
        aria-label="Fortress AI Banking Assistant"
        aria-modal="false"
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '24px',
          width: '420px',
          height: '620px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 60px rgba(10, 22, 40, 0.35), 0 8px 24px rgba(10, 22, 40, 0.2)',
          background: '#ffffff',
          animation: 'aiWidgetIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        className="ai-widget-root dark:bg-slate-900 border border-slate-800/40"
      >
        <style>{`
          @keyframes aiWidgetIn {
            from { opacity: 0; transform: scale(0.92) translateY(16px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
          @media (max-width: 480px) {
            .ai-widget-root {
              bottom: 80px !important;
              right: 12px !important;
              left: 12px !important;
              width: auto !important;
            }
          }
        `}</style>

        {/* Header (navy background, tabs sit on bottom edge) */}
        <AIHeader showExpand compact={true} />

        {/* Conversation (light gray-blue background) */}
        <AIConversation compact />

        {/* Input (navy background) */}
        <AIInput compact />

        {/* Disclaimer Bar (full-width dark bar at the bottom) */}
        <div className="flex items-center gap-1.5 bg-black/25 dark:bg-black/40 pt-1.5 pb-6 px-5 select-none shrink-0 border-t border-white/[0.04]">
          <svg className="w-[12px] h-[12px] text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-[10.5px] text-white/60 dark:text-slate-400 leading-normal font-semibold">
            AI responses are informational and do not constitute final lending decisions.
          </p>
        </div>
      </div>
    </>
  );
}
