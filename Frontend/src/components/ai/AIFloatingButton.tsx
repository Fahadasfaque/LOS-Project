'use client';

import { useAI } from './AIProvider';

/**
 * Fixed bottom-right floating button.
 * Pulsing blue-gradient circle with shield icon and online indicator.
 * Tooltip: "Ask Fortress AI"
 */
export function AIFloatingButton() {
  const { mode, toggle } = useAI();

  const isOpen = mode !== 'closed';

  const handleClick = () => {
    if (mode === 'fullscreen') return; // don't close fullscreen from button
    toggle();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9997,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
      }}
    >
      <style>{`
        @keyframes ai-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ai-btn-in {
          from { opacity: 0; transform: scale(0.7) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        .ai-fab:hover .ai-fab-tooltip { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .ai-fab-tooltip {
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.18s, transform 0.18s;
          pointer-events: none;
        }
        .ai-fab-icon-close {
          animation: ai-icon-spin-in 0.2s ease both;
        }
        @keyframes ai-icon-spin-in {
          from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
          to   { transform: rotate(0)      scale(1);   opacity: 1; }
        }
        @media (max-width: 480px) {
          .ai-fab-root { bottom: 16px !important; right: 16px !important; }
        }
      `}</style>

      {/* Tooltip */}
      {!isOpen && (
        <div
          className="ai-fab-tooltip"
          style={{
            background: 'rgba(15,23,42,0.92)',
            color: '#f1f5f9',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          Ask Fortress AI
        </div>
      )}

      {/* Pulse ring (only when closed) */}
      {!isOpen && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.35)',
            animation: 'ai-pulse-ring 2.4s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main button */}
      <div className="ai-fab" style={{ position: 'relative' }}>
        <button
          onClick={handleClick}
          aria-label={isOpen ? 'Close Fortress AI' : 'Open Fortress AI assistant'}
          aria-expanded={isOpen}
          title={isOpen ? 'Close assistant' : 'Ask Fortress AI'}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: isOpen
              ? 'linear-gradient(135deg, #475569, #334155)'
              : 'linear-gradient(135deg, #1d4ed8, #4f46e5)',
            boxShadow: isOpen
              ? '0 4px 16px rgba(15,23,42,0.3)'
              : '0 8px 32px rgba(79,70,229,0.45), 0 2px 8px rgba(29,78,216,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
            animation: 'ai-btn-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
            position: 'relative',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        >
          {/* Icon */}
          {isOpen ? (
            /* Close X */
            <svg className="ai-fab-icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            /* Shield / Bank icon */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" strokeWidth="2"/>
            </svg>
          )}

          {/* Online indicator */}
          {!isOpen && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid white',
              }}
            />
          )}
        </button>

        {/* Hover tooltip (shows above button) */}
        {!isOpen && (
          <div
            className="ai-fab-tooltip"
            style={{
              position: 'absolute',
              bottom: '64px',
              right: 0,
              background: 'rgba(15,23,42,0.92)',
              color: '#f1f5f9',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}
          >
            Ask Fortress AI
          </div>
        )}
      </div>
    </div>
  );
}
