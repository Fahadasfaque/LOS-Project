'use client';

// Animated typing indicator — three bouncing dots
export function AITyping() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400"
        style={{ animation: 'ai-dot-bounce 1.2s ease-in-out 0s infinite' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400"
        style={{ animation: 'ai-dot-bounce 1.2s ease-in-out 0.15s infinite' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-blue-400"
        style={{ animation: 'ai-dot-bounce 1.2s ease-in-out 0.3s infinite' }}
      />
      <style>{`
        @keyframes ai-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
