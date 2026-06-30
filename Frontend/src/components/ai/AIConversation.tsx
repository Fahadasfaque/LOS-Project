'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CopyIcon, CheckIcon, ThumbsUpIcon, ThumbsDownIcon } from '@phosphor-icons/react';
import { useAI } from './AIProvider';
import { AITyping } from './AITyping';
import { AIQuickActions } from './AIQuickActions';
import type { Message } from './AIProvider';

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function inlineFmt(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-850 dark:text-slate-200 font-mono text-[10px] border border-slate-250/60 dark:border-slate-700/60">
          {p.slice(1, -1)}
        </code>
      );
    return p;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const els: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      els.push(
        <pre key={`cb${i}`} className="my-2 bg-slate-950 dark:bg-black/60 text-slate-100 rounded-xl p-3 text-[11px] font-mono overflow-x-auto border border-slate-800/60">
          {code.join('\n')}
        </pre>
      );
    }
    // Table
    else if (line.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const headers = rows[0].split('|').filter(Boolean).map(h => h.trim());
      const data = rows.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()));
      els.push(
        <div key={`tb${i}`} className="my-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                {headers.map((h, j) => <th key={j} className="px-3 py-2 text-left font-bold text-slate-850 dark:text-slate-200">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-100 dark:border-slate-900/50 last:border-0 hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                  {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // H3
    else if (line.startsWith('### '))
      els.push(<h3 key={i} className="font-bold text-xs text-slate-900 dark:text-white mt-3 mb-1">{inlineFmt(line.slice(4))}</h3>);
    // H2
    else if (line.startsWith('## '))
      els.push(<h2 key={i} className="font-bold text-sm text-slate-900 dark:text-white mt-4 mb-1.5">{inlineFmt(line.slice(3))}</h2>);
    // Bullet list
    else if (line.match(/^[-*•] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•] /)) { items.push(lines[i].slice(2)); i++; }
      els.push(
        <ul key={`ul${i}`} className="my-1.5 space-y-1 pl-0.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/80 shrink-0" />
              <span>{inlineFmt(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      els.push(
        <ol key={`ol${i}`} className="my-1.5 space-y-1 pl-0.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              <span className="w-4 h-4 mt-0.5 rounded-full bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold flex items-center justify-center shrink-0 border border-blue-200/40 dark:border-blue-900/40">
                {j + 1}
              </span>
              <span>{inlineFmt(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Paragraph
    else if (line.trim())
      els.push(<p key={i} className="text-[13px] text-slate-650 dark:text-slate-300 leading-relaxed mb-1 font-medium">{inlineFmt(line)}</p>);
    else
      els.push(<div key={i} className="h-1.5" />);

    i++;
  }

  return <>{els}</>;
}

// ─── Single message bubble ─────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const { setFeedback, sendMessage } = useAI();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const formattedTime = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end gap-2 px-4 animate-slide-up-msg">
        <div className="max-w-[78%]">
          <div className="bg-[#2563eb] text-white rounded-2xl rounded-br-[4px] px-3.5 py-2.5 shadow-sm">
            <p className="text-[13px] font-semibold leading-relaxed tracking-wide">{msg.content}</p>
          </div>
          <div className="bubble-meta right text-[10px] text-slate-400 dark:text-slate-550 mt-1 text-right font-semibold pr-1">
            {formattedTime}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message (avatar is bottom-aligned next to bubble, metadata is below bubble with pl-[34px])
  return (
    <div className="flex flex-col gap-1.5 px-4 animate-slide-up-msg group relative w-full max-w-[85%] mr-auto">
      {/* Row containing Avatar and Bubble */}
      <div className="flex items-end gap-2 w-full">
        {/* AI Avatar iconify-style (26x26, rounded-lg/8px, check shield SVG inside) */}
        <div className="w-[26px] h-[26px] rounded-[8px] bg-[#2563eb] flex items-center justify-center text-white shrink-0 shadow-sm mb-[5px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4" strokeWidth="3"/>
          </svg>
        </div>

        {/* Content Bubble (white bg, rounded-2xl, border-bl is 4px/sm) */}
        <div className="flex-1 min-w-0">
          {msg.thinking ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-bl-[4px] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-bold tracking-wide">Analyzing application data...</span>
            </div>
          ) : msg.typing ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-bl-[4px] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 shadow-sm">
              <AITyping />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-bl-[4px] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 shadow-sm">
              <div className="prose-xs max-w-none text-[13px] text-slate-800 dark:text-slate-200">
                {renderMarkdown(msg.content)}
                {msg.streaming && (
                  <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-1 animate-pulse rounded-full align-middle" />
                )}
              </div>

              {msg.contextTag && !msg.streaming && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[8px] text-slate-400 dark:text-slate-650 font-bold select-none uppercase tracking-wide">
                  <span>Context: {msg.contextTag}</span>
                  <span>Secure Connection</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Follow-up suggestions */}
      {!msg.thinking && !msg.typing && !msg.streaming && msg.followups && msg.followups.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-[34px] mt-2 mb-3 animate-fade-in-quick">
          {msg.followups.map(fp => (
            <button
              key={fp}
              onClick={() => sendMessage(fp)}
              className="
                px-3 py-1.5 rounded-full
                bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40
                border border-blue-150 dark:border-blue-900/40
                text-[10px] font-bold text-blue-600 dark:text-blue-400
                transition-all duration-150 cursor-pointer shadow-sm
              "
            >
              {fp}
            </button>
          ))}
        </div>
      )}

      {/* Bubble Meta Label & Actions */}
      {!msg.thinking && !msg.typing && (
        <div className="flex items-center justify-between w-full mt-0.5 pl-[34px] pr-1 font-semibold select-none">
          <div className="flex items-center gap-2.5 text-[10px] text-slate-400 dark:text-slate-550">
            <span>Fortress AI · {formattedTime}</span>
          </div>

          {/* Action Row */}
          {!msg.streaming && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <MsgBtn onClick={copy} title="Copy response">
                {copied
                  ? <CheckIcon weight="bold" className="w-2.5 h-2.5 text-emerald-500" />
                  : <CopyIcon weight="bold" className="w-2.5 h-2.5" />}
              </MsgBtn>
              <MsgBtn
                onClick={() => setFeedback(msg.id, 'up')}
                title="Helpful"
                active={msg.feedback === 'up'}
                activeCls="text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
              >
                <ThumbsUpIcon weight={msg.feedback === 'up' ? 'fill' : 'bold'} className="w-2.5 h-2.5" />
              </MsgBtn>
              <MsgBtn
                onClick={() => setFeedback(msg.id, 'down')}
                title="Not helpful"
                active={msg.feedback === 'down'}
                activeCls="text-rose-500 bg-rose-50/50 dark:bg-rose-950/20"
              >
                <ThumbsDownIcon weight={msg.feedback === 'down' ? 'fill' : 'bold'} className="w-2.5 h-2.5" />
              </MsgBtn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MsgBtn({
  onClick,
  title,
  children,
  active = false,
  activeCls = '',
  disabled = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  activeCls?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1 rounded transition-all cursor-pointer ${
        active
          ? `${activeCls}`
          : disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'text-slate-400 dark:text-slate-650 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface SuggestionItem {
  q: string;
  category: string;
}

const SMART_SUGGESTIONS: SuggestionItem[] = [
  { q: 'What is the required documentation checklist for an application?', category: 'Getting Started' },
  { q: 'What is the credit score and CIBIL evaluation framework?', category: 'Popular Questions' },
  { q: 'How is the debt-to-income (DTI) ratio calculated?', category: 'Loan Tools' },
  { q: 'Show me the stages to track my loan application processing status', category: 'Application Tracking' },
];

function EmptyState({ compact }: { compact: boolean }) {
  const { sendMessage } = useAI();

  // Get dynamic time-of-day greeting
  const [greeting, setGreeting] = useState('Good Day');
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) setGreeting('Good Morning');
    else if (hours >= 12 && hours < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <div className={`flex flex-col items-center ${compact ? 'justify-start' : 'justify-center'} flex-1 text-center animate-fade-up-welcome font-sans w-full px-4 pb-4`}>
      {/* Welcome Area (exactly matching template spacing and details) */}
      <div className={`px-6 flex flex-col items-center ${compact ? 'pt-2 pb-4' : 'pt-5 pb-4'}`}>
        {/* Avatar container (56x56, border radius 16px, bg gradient, box shadow, shield check inside) */}
        {!compact && (
          <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.3)] mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" strokeWidth="2.8"/>
            </svg>
          </div>
        )}

        {/* Greeting & Headline */}
        <h3 className="welcome-greeting text-[20px] font-bold text-slate-900 dark:text-white tracking-tight mb-1.5 leading-none">
          {greeting}, Customer
        </h3>
        <p className="welcome-tagline text-slate-900 dark:text-white font-semibold text-[14px] leading-relaxed mb-2">
          I am Fortress AI, your digital banking assistant.
        </p>
        <p className="welcome-desc text-slate-600 dark:text-slate-400 text-[12.5px] max-w-[300px] leading-relaxed font-normal">
          Ask about loan guidelines, credit scores, debt-to-income analysis, documentation requirements, and timeline tracking.
        </p>
      </div>

      {/* Quick Action capability cards */}
      <div className="w-full">
        <AIQuickActions compact={compact} />
      </div>

      {/* Static Welcome Message bubble in empty state (exactly matching the template's messages layout) */}
      <div className="w-full px-4 pb-4 text-left flex items-start gap-2">
        {/* AI Avatar */}
        <div className="w-[26px] h-[26px] rounded-[8px] bg-[#2563eb] flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4" strokeWidth="3"/>
          </svg>
        </div>

        <div className={`flex flex-col gap-1 ${compact ? 'max-w-[85%]' : 'max-w-[85%] md:max-w-[600px]'}`}>
          {/* Bubble (white bg, rounded-2xl, border-bl is 4px/sm) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-bl-[4px] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 shadow-sm">
            <p className="text-[13px] text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
              I can help you with loan eligibility, EMI calculations, and document requirements. What would you like to explore today?
            </p>
          </div>
          
          {/* Bubble Meta Label */}
          <div className="bubble-meta text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 ml-0.5 font-semibold">
            Fortress AI · Just now
          </div>
        </div>
      </div>

      {/* Smart Suggestions grouped by section */}
      {!compact && (
        <div className="w-full px-4 pb-6 text-left">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm">
            <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-650 mb-3">
              Suggested Inquiries
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SMART_SUGGESTIONS.map(s => (
                <button
                  key={s.q}
                  onClick={() => sendMessage(s.q)}
                  className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-200 dark:border-slate-800/40 dark:hover:border-blue-900/40 bg-slate-50/50 hover:bg-blue-50/20 dark:bg-slate-950/25 dark:hover:bg-slate-950/60 transition-all cursor-pointer group"
                >
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-500 dark:text-blue-400 block mb-1">
                    {s.category}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-bold block">
                    {s.q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main conversation list ───────────────────────────────────────────────────

interface AIConversationProps {
  compact?: boolean;
}

export function AIConversation({ compact = false }: AIConversationProps) {
  const { messages, activeConv } = useAI();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col justify-start bg-[#f0f4f9] dark:bg-[#0c1222] scrollbar-none min-h-0">
        <EmptyState compact={compact} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#f0f4f9] dark:bg-[#0c1222] scrollbar-none min-h-0">
      {/* Context Badge above messages removed */}

      {/* Message List */}
      <div className="flex-1 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes slideUpMsg {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-msg {
          animation: slideUpMsg 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes fadeUpWelcome {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up-welcome {
          animation: fadeUpWelcome 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes fadeInQuick {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-in-quick {
          animation: fadeInQuick 0.3s ease both;
        }
      `}</style>
    </div>
  );
}
