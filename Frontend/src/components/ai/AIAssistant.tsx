'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SparkleIcon,
  PaperPlaneTiltIcon,
  StopIcon,
  CopyIcon,
  CheckIcon,
  ArrowClockwiseIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CaretDownIcon,
  XIcon,
  PlusIcon,
  ClockCounterClockwiseIcon,
  LightbulbIcon,
  ShieldCheckIcon,
  ChartLineUpIcon,
  FileTextIcon,
  BuildingsIcon,
  UserIcon,
  BankIcon,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  streaming?: boolean;
  feedback?: 'up' | 'down' | null;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// ─── Mock Responses ───────────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<string, string> = {
  default: `I'm **Fortress AI**, your enterprise banking intelligence assistant. I can help you with:

- **Loan Application Analysis** — Review eligibility, assess risk profiles, and identify red flags
- **Regulatory Compliance** — Navigate KYC/AML requirements, Basel III guidelines, and local regulations
- **Credit Assessment** — Analyze financial statements, debt-to-income ratios, and creditworthiness
- **Portfolio Intelligence** — Monitor loan performance, early warning signals, and trend analysis
- **Workflow Guidance** — Step-by-step process support for loan officers and analysts

What would you like to explore today?`,

  loan: `Based on our **Loan Origination System** data, here's a comprehensive eligibility assessment framework:

### Credit Score Evaluation
| Score Range | Risk Band | Decision |
|-------------|-----------|---------|
| 750+ | Prime | Auto-approve eligible |
| 680–749 | Near-Prime | Standard underwriting |
| 620–679 | Subprime | Enhanced review |
| Below 620 | High Risk | Manual override required |

### Key Debt-to-Income Thresholds
- **Front-end DTI**: ≤28% (housing costs / gross income)
- **Back-end DTI**: ≤43% (all debts / gross income)
- **Exception policy**: Up to 50% with compensating factors

### Required Documentation
1. Last 3 months bank statements
2. 2 years tax returns (W-2 or self-employed)
3. Employment verification letter
4. Property appraisal (for secured loans)

Would you like me to walk through a specific application in the queue?`,

  compliance: `**Regulatory Compliance Summary — FY 2025**

### KYC/AML Requirements
Our platform enforces a **4-tier verification** pipeline:

1. **Identity Verification** — Government-issued ID cross-referenced with CNIC/NADRA database
2. **Sanctions Screening** — Real-time OFAC, UN, and local watchlist checks
3. **PEP Screening** — Politically Exposed Persons identification
4. **Enhanced Due Diligence** — For high-risk customers or transactions >PKR 2.5M

### Current Compliance Score
- ✅ KYC completion rate: **98.7%**
- ✅ SAR filings: **23 this quarter** (within threshold)
- ⚠️ Pending EDD reviews: **12 cases** (action required)
- ✅ Last audit: **December 2024** — No material findings

### Upcoming Deadlines
- SECP reporting: **Due July 15**
- Annual AML policy review: **Due August 1**

Shall I generate a detailed compliance report or flag specific cases?`,

  risk: `**Risk Assessment Dashboard — Real-Time Analysis**

### Portfolio Health Overview

\`\`\`
Total Portfolio: PKR 4.2B
NPL Ratio:       3.2% (Industry avg: 4.8%)
Coverage Ratio:  142%
PAR 30+:         5.1%
\`\`\`

### Early Warning Signals Detected
🔴 **High Priority (3 accounts)**
- Account #LA-2024-0892: 45 DPD, PKR 12.5M exposure
- Account #LA-2024-1104: Employer bankruptcy filed
- Account #LA-2024-0673: NSF pattern last 60 days

🟡 **Medium Priority (8 accounts)**
- Behavioral scoring drop >15 points
- Sector concentration in real estate (32% of book)

### Recommended Actions
1. Initiate restructuring dialogue for red accounts
2. Increase provisioning by estimated PKR 8.2M
3. Freeze new disbursements to flagged sectors

Would you like a full export or drill into specific accounts?`,

  process: `**Loan Processing Workflow — End-to-End Guide**

### Stage 1: Application Intake *(Loan Officer)*
- Customer KYC verification
- Document collection & quality check
- Initial eligibility screening
- System entry & case assignment

### Stage 2: Credit Assessment *(Credit Analyst)*
- Bureau report pull & analysis
- Financial statement review
- Employment & income verification
- Risk scoring & recommendation

### Stage 3: Approval Decision *(Approver/Committee)*
- Final risk review
- Pricing & terms structuring
- Conditional approval / decline
- Offer letter generation

### Stage 4: Disbursement *(Operations)*
- Signed documents collection
- Legal vetting
- Account setup & fund transfer
- Post-disbursement monitoring

**Average TAT**: 3–5 business days
**Express TAT**: 24 hours (pre-approved customers)

Need help with any specific stage or a particular application?`,
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('loan') || lower.includes('eligib') || lower.includes('credit score') || lower.includes('dti')) {
    return DEMO_RESPONSES.loan;
  }
  if (lower.includes('complian') || lower.includes('kyc') || lower.includes('aml') || lower.includes('regul')) {
    return DEMO_RESPONSES.compliance;
  }
  if (lower.includes('risk') || lower.includes('npl') || lower.includes('portfolio') || lower.includes('warning')) {
    return DEMO_RESPONSES.risk;
  }
  if (lower.includes('process') || lower.includes('workflow') || lower.includes('stage') || lower.includes('how')) {
    return DEMO_RESPONSES.process;
  }
  return DEMO_RESPONSES.default;
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: <FileTextIcon weight="duotone" className="w-4 h-4" />, label: 'Loan eligibility criteria', color: 'blue' },
  { icon: <ShieldCheckIcon weight="duotone" className="w-4 h-4" />, label: 'Compliance checklist', color: 'emerald' },
  { icon: <ChartLineUpIcon weight="duotone" className="w-4 h-4" />, label: 'Portfolio risk summary', color: 'violet' },
  { icon: <ClockCounterClockwiseIcon weight="duotone" className="w-4 h-4" />, label: 'Loan processing workflow', color: 'amber' },
];

const PROMPT_COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50 dark:hover:bg-blue-950/60',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 dark:hover:bg-emerald-950/60',
  violet: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/50 dark:hover:bg-violet-950/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-950/60',
};

// ─── Markdown Renderer (minimal, inline) ──────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-3 bg-slate-950 dark:bg-black/60 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto border border-slate-800/60 shadow-inner">
          {codeLines.join('\n')}
        </pre>
      );
    }
    // Table
    else if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split('|').filter(Boolean).map(h => h.trim());
      const rows = tableLines.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()));
      elements.push(
        <div key={i} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/60">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/60">
                {headers.map((h, j) => (
                  <th key={j} className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-100 dark:border-slate-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-bold text-sm text-slate-900 dark:text-white mt-4 mb-1.5">{inlineFormat(line.slice(4))}</h3>);
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-bold text-base text-slate-900 dark:text-white mt-5 mb-2">{inlineFormat(line.slice(3))}</h2>);
    }
    // List item
    else if (line.match(/^[-*•] /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•] /)) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 shrink-0" />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                {j + 1}
              </span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Horizontal rule
    else if (line === '---' || line === '***') {
      elements.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-800/60" />);
    }
    // Normal paragraph
    else if (line.trim()) {
      elements.push(<p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-1">{inlineFormat(line)}</p>);
    }
    // Empty line
    else {
      elements.push(<div key={i} className="h-1" />);
    }

    i++;
  }

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  // Bold + code inline
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-mono text-[11px] border border-slate-200/80 dark:border-slate-700/60">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─── Message Component ────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onFeedback,
  onCopy,
}: {
  message: Message;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="max-w-[75%]">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm shadow-blue-500/10">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-center shrink-0 mt-0.5">
          <UserIcon weight="fill" className="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-blue-500/20">
        <BankIcon weight="fill" className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Typing indicator */}
        {message.streaming && message.content === '' ? (
          <div className="flex items-center gap-1 h-8 px-4 py-3 bg-white dark:bg-slate-900/60 rounded-2xl rounded-tl-sm border border-slate-200/60 dark:border-slate-800/60 w-fit shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl rounded-tl-sm border border-slate-200/60 dark:border-slate-800/60 px-4 py-3.5 shadow-sm">
            <div className="prose-sm max-w-none">
              {renderMarkdown(message.content)}
              {message.streaming && (
                <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse rounded-full" />
              )}
            </div>
          </div>
        )}

        {/* Actions row */}
        {!message.streaming && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mr-1">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <ActionButton onClick={handleCopy} title="Copy">
              {copied ? <CheckIcon weight="bold" className="w-3 h-3 text-emerald-500" /> : <CopyIcon weight="bold" className="w-3 h-3" />}
            </ActionButton>
            <ActionButton
              onClick={() => onFeedback(message.id, 'up')}
              title="Helpful"
              active={message.feedback === 'up'}
              activeClass="text-emerald-600 dark:text-emerald-400"
            >
              <ThumbsUpIcon weight={message.feedback === 'up' ? 'fill' : 'bold'} className="w-3 h-3" />
            </ActionButton>
            <ActionButton
              onClick={() => onFeedback(message.id, 'down')}
              title="Not helpful"
              active={message.feedback === 'down'}
              activeClass="text-rose-600 dark:text-rose-400"
            >
              <ThumbsDownIcon weight={message.feedback === 'down' ? 'fill' : 'bold'} className="w-3 h-3" />
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  title,
  children,
  active = false,
  activeClass = '',
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? `${activeClass} bg-slate-100 dark:bg-slate-800`
          : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIAssistant({ embedded = false }: { embedded?: boolean }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages ?? [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const newConversation = useCallback((): string => {
    const id = `conv-${Date.now()}`;
    const conv: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    return id;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let convId = activeConvId;
    if (!convId) {
      convId = newConversation();
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    // Update title from first message
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? {
              ...c,
              title: text.trim().slice(0, 42) + (text.trim().length > 42 ? '…' : ''),
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );
    setInput('');
    setIsStreaming(true);

    // Add empty streaming assistant message
    const asstId = `msg-${Date.now()}-asst`;
    const asstMsg: Message = {
      id: asstId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, asstMsg] } : c
      )
    );

    // Simulate streaming
    await new Promise(r => setTimeout(r, 600)); // initial delay (typing dots)

    const fullResponse = getResponse(text);
    let charIndex = 0;
    const chunkSize = 8;

    const streamChunk = () => {
      if (charIndex >= fullResponse.length) {
        // Done streaming
        setConversations(prev =>
          prev.map(c =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === asstId ? { ...m, content: fullResponse, streaming: false } : m
                  ),
                }
              : c
          )
        );
        setIsStreaming(false);
        return;
      }

      const nextIndex = Math.min(charIndex + chunkSize, fullResponse.length);
      const partial = fullResponse.slice(0, nextIndex);
      charIndex = nextIndex;

      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === asstId ? { ...m, content: partial } : m
                ),
              }
            : c
        )
      );

      streamTimerRef.current = setTimeout(streamChunk, 18);
    };

    streamChunk();
  }, [activeConvId, isStreaming, newConversation]);

  const stopStreaming = () => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    setConversations(prev =>
      prev.map(c => ({
        ...c,
        messages: c.messages.map(m =>
          m.streaming ? { ...m, streaming: false } : m
        ),
      }))
    );
    setIsStreaming(false);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setConversations(prev =>
      prev.map(c => ({
        ...c,
        messages: c.messages.map(m =>
          m.id === msgId
            ? { ...m, feedback: m.feedback === type ? null : type }
            : m
        ),
      }))
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className={`flex h-full ${embedded ? '' : 'min-h-screen'} bg-slate-50 dark:bg-slate-950`}>
      {/* ── Sidebar (History) ── */}
      <aside
        className={`
          flex flex-col border-r border-slate-200/80 dark:border-slate-800/60
          bg-white dark:bg-slate-900/80 backdrop-blur-sm
          transition-all duration-300 shrink-0
          ${showHistory ? 'w-72' : 'w-0 overflow-hidden border-r-0'}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800/60">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">History</span>
          <button
            onClick={() => setShowHistory(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <XIcon weight="bold" className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3">
          <button
            onClick={newConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 transition-colors cursor-pointer"
          >
            <PlusIcon weight="bold" className="w-4 h-4" />
            New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-8">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  conv.id === activeConvId
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-blue-900/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <p className="truncate font-medium">{conv.title}</p>
                <p className="text-slate-400 dark:text-slate-600 mt-0.5">
                  {conv.createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-800/60"
            >
              <ClockCounterClockwiseIcon weight="bold" className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={newConversation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-800/60"
            >
              <PlusIcon weight="bold" className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Model badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-900/50 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              <SparkleIcon weight="fill" className="w-3 h-3 text-blue-500" />
              Fortress AI · Banking
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmptyState ? (
            <EmptyState onPrompt={sendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onFeedback={handleFeedback}
                  onCopy={handleCopy}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 backdrop-blur-sm px-5 py-4">
          <div className="max-w-3xl mx-auto">
            {/* Suggested prompts (when not empty) */}
            {!isEmptyState && !isStreaming && (
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED_PROMPTS.slice(0, 2).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${PROMPT_COLORS[p.color]}`}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Textarea row */}
            <div className="flex items-end gap-3 bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-sm px-4 py-3 focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about loans, compliance, risk, or processing workflows…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent resize-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none leading-relaxed max-h-40 overflow-y-auto disabled:opacity-50"
              />

              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  title="Stop generating"
                >
                  <StopIcon weight="fill" className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="shrink-0 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30"
                  title="Send message"
                >
                  <PaperPlaneTiltIcon weight="fill" className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2.5">
              Fortress AI may make mistakes. Always verify critical decisions with a qualified professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  const capabilities = [
    {
      icon: <FileTextIcon weight="duotone" className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: 'Loan Analysis',
      desc: 'Eligibility, DTI ratios, credit assessment',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: <ShieldCheckIcon weight="duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: 'Compliance',
      desc: 'KYC/AML, regulatory frameworks, audits',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: <ChartLineUpIcon weight="duotone" className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      title: 'Risk Intelligence',
      desc: 'Portfolio health, early warnings, NPL analysis',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      icon: <BuildingsIcon weight="duotone" className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      title: 'Workflow Guidance',
      desc: 'End-to-end process support for all roles',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
      <div className="max-w-2xl w-full">
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BankIcon weight="fill" className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
          How can I help you today?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-10 leading-relaxed">
          Your enterprise banking intelligence assistant. Ask me anything about<br />
          loan operations, compliance, risk management, or processing workflows.
        </p>

        {/* Capability cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {capabilities.map((cap, i) => (
            <button
              key={i}
              onClick={() => onPrompt(cap.desc)}
              className={`flex items-start gap-3 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-left hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all cursor-pointer group ${cap.bg}`}
            >
              <div className="mt-0.5">{cap.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{cap.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{cap.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Suggested prompts */}
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-3 text-center">
            Suggested
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => onPrompt(p.label)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer hover:shadow-sm ${PROMPT_COLORS[p.color]}`}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
