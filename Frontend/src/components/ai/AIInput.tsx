'use client';

import { useRef, useEffect, useState } from 'react';
import { useAI } from './AIProvider';
import { PaperPlaneTiltIcon, StopIcon, PaperclipIcon, MicrophoneIcon, SmileyIcon, ShieldIcon } from '@phosphor-icons/react';

interface AIInputProps {
  placeholder?: string;
  compact?: boolean;
}

export function AIInput({
  placeholder = 'Ask about loans, eligibility, policies…',
  compact = false,
}: AIInputProps) {
  const { sendMessage, stopStreaming, status } = useAI();
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === 'processing' || status === 'responding';

  // Auto-resize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, compact ? 100 : 160) + 'px';
  }, [value, compact]);

  const submit = () => {
    if (!value.trim() || isStreaming) return;
    sendMessage(value.trim());
    setValue('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col bg-[#0d1f40] pt-3 pb-2.5 px-3.5 select-none font-sans shrink-0">
      {/* Input container (rounded-full pill shape with transparent white background) */}
      <div
        className="
          flex items-center gap-2
          bg-white/[0.08] border border-white/[0.12]
          rounded-full pl-4 pr-1.5 py-1.5 min-h-[44px]
          focus-within:border-blue-500/50
          transition-all duration-150
        "
      >
        {/* Left: Text Area */}
        <textarea
          ref={taRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={1}
          disabled={isStreaming}
          aria-label="Ask Fortress AI"
          className="
            flex-1 bg-transparent resize-none
            text-white placeholder-white/35
            focus:outline-none leading-relaxed font-normal
            max-h-24 overflow-y-auto pt-1 text-[13px]
            disabled:opacity-50
          "
          style={{ height: '22px' }}
        />

        {/* Right Group: Actions (clip, smile, mic) + Send Button */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled
            title="Upload document (disabled)"
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white/40 hover:text-white/60 opacity-60 cursor-not-allowed"
          >
            <PaperclipIcon weight="bold" className="w-[16px] h-[16px]" />
          </button>

          <button
            type="button"
            disabled
            title="Emoji (disabled)"
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white/40 hover:text-white/60 opacity-60 cursor-not-allowed"
          >
            <SmileyIcon weight="bold" className="w-[16px] h-[16px]" />
          </button>

          <button
            type="button"
            disabled
            title="Voice input (disabled)"
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white/40 hover:text-white/60 opacity-60 cursor-not-allowed"
          >
            <MicrophoneIcon weight="bold" className="w-[16px] h-[16px]" />
          </button>

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              title="Stop generating"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <StopIcon weight="fill" className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim()}
              title="Send message"
              aria-label="Send message"
              className="
                w-8 h-8 flex items-center justify-center rounded-full bg-[#2563eb] text-white
                disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer
                shadow-[0_2px_8px_rgba(37,99,235,0.4)] hover:bg-blue-600
              "
            >
              <PaperPlaneTiltIcon weight="fill" className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {/* Footer underneath pill */}
      <div className="flex items-center justify-between mt-2 px-1 text-[10px] select-none font-medium">
        <span className="text-white/25">Press Enter to send · Shift+Enter for new line</span>
        <div className="flex items-center gap-1">
          <ShieldIcon weight="fill" className="w-[11px] h-[11px] text-[#22c55e]" />
          <span className="text-white/35 font-semibold">Banking Security Verified</span>
        </div>
      </div>
    </div>
  );
}
