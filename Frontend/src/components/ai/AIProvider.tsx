'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = 'user' | 'assistant';
export type FeedbackType = 'up' | 'down' | null;
export type AIStatus = 'ready' | 'responding' | 'processing' | 'offline';
export type AIMode = 'general' | 'advisor' | 'emi' | 'policy' | 'tracker';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  thinking?: boolean;
  typing?: boolean;
  streaming?: boolean;
  feedback?: FeedbackType;
  followups?: string[]; // contextual chips
  contextTag?: string;  // e.g. "Home Loan Discussion"
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  mode: AIMode;
}

export type WidgetMode = 'closed' | 'widget' | 'fullscreen';

interface AIContextValue {
  // ── Widget state ──
  mode: WidgetMode;
  open: () => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;

  // ── Conversation state ──
  conversations: Conversation[];
  activeConvId: string | null;
  activeConv: Conversation | undefined;
  messages: Message[];
  status: AIStatus;
  activeMode: AIMode;
  setActiveMode: (mode: AIMode) => void;

  // ── Actions ──
  newConversation: (mode?: AIMode) => string;
  selectConversation: (id: string) => void;
  sendMessage: (text: string) => void;
  stopStreaming: () => void;
  setFeedback: (msgId: string, type: FeedbackType) => void;
}

// ─── Mock responses & follow-up suggestion chips ──────────────────────────────

interface MockResponseConfig {
  text: string;
  followups: string[];
  contextTag: string;
}

const MOCK_RESPONSES: Record<string, MockResponseConfig> = {
  default: {
    text: `I'm **Fortress AI**, your enterprise banking intelligence assistant. I can help you with:

- **Loan Application Analysis** — Eligibility, risk profiles, red flags
- **Regulatory Compliance** — KYC/AML, Basel III, local regulations  
- **Credit Assessment** — Financial statements, DTI ratios, creditworthiness
- **Portfolio Intelligence** — Loan performance, early warning signals
- **Workflow Guidance** — Step-by-step process support for all roles

What would you like to explore today?`,
    followups: ['Calculate Loan EMI', 'Check Loan eligibility', 'KYC checklist', 'Portfolio risk overview'],
    contextTag: 'General Support',
  },

  loan: {
    text: `Based on our **Loan Origination System** data, here's a comprehensive eligibility framework:

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
2. 2 years tax returns
3. Employment verification letter
4. Property appraisal (for secured loans)

Would you like me to walk through a specific application in the queue?`,
    followups: ['EMI Calculator', 'Required Documents', 'Interest Rates', 'Check eligibility criteria'],
    contextTag: 'Loan Eligibility Check',
  },

  compliance: {
    text: `**Regulatory Compliance Summary — FY 2025**

### KYC/AML Requirements
Our platform enforces a **4-tier verification** pipeline:

1. **Identity Verification** — Government-issued ID cross-referenced with CNIC/NADRA
2. **Sanctions Screening** — Real-time OFAC, UN, and local watchlist checks
3. **PEP Screening** — Politically Exposed Persons identification
4. **Enhanced Due Diligence** — For high-risk customers or transactions >PKR 2.5M

### Current Compliance Score
- ✅ KYC completion rate: **98.7%**
- ✅ SAR filings: **23 this quarter**
- ⚠️ Pending EDD reviews: **12 cases** (action required)
- ✅ Last audit: **December 2024** — No material findings

Shall I generate a detailed compliance report or flag specific cases?`,
    followups: ['KYC Requirements', 'AML Sanctions Check', 'Regulatory Scorecard', 'SAR Guidelines'],
    contextTag: 'Compliance Advisory',
  },

  risk: {
    text: `**Risk Assessment Dashboard — Real-Time Analysis**

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

Would you like a full export or drill into specific accounts?`,
    followups: ['Portfolio Risk Summary', 'Early Warnings List', 'NPL Ratio Breakdown', 'Credit Score Evaluation'],
    contextTag: 'Risk Analytics',
  },

  process: {
    text: `**Loan Processing Workflow — End-to-End Guide**

### Stage 1: Application Intake *(Loan Officer)*
- Customer KYC verification
- Document collection & quality check
- Initial eligibility screening

### Stage 2: Credit Assessment *(Credit Analyst)*
- Bureau report pull & analysis
- Financial statement review
- Risk scoring & recommendation

### Stage 3: Approval Decision *(Approver/Committee)*
- Final risk review
- Pricing & terms structuring
- Offer letter generation

### Stage 4: Disbursement *(Operations)*
- Signed documents collection
- Account setup & fund transfer
- Post-disbursement monitoring

**Average TAT**: 3–5 business days
**Express TAT**: 24 hours (pre-approved)`,
    followups: ['Track Application Stage', 'Operations TAT', 'Document Checklist', 'Disbursement Steps'],
    contextTag: 'Workflow Guidance',
  },
};

function getMockResponse(input: string, mode: AIMode): MockResponseConfig {
  const l = input.toLowerCase();

  // If specific mode is selected, default to that category if matches aren't forced
  if (l.includes('loan') || l.includes('eligib') || l.includes('credit score') || mode === 'advisor') {
    return MOCK_RESPONSES.loan;
  }
  if (l.includes('complian') || l.includes('kyc') || l.includes('aml') || l.includes('regul') || mode === 'policy') {
    return MOCK_RESPONSES.compliance;
  }
  if (l.includes('risk') || l.includes('npl') || l.includes('portfolio') || l.includes('warning')) {
    return MOCK_RESPONSES.risk;
  }
  if (l.includes('process') || l.includes('workflow') || l.includes('stage') || l.includes('track') || mode === 'tracker') {
    return MOCK_RESPONSES.process;
  }
  if (l.includes('emi') || l.includes('calculat') || mode === 'emi') {
    return {
      text: `**Amortization & EMI Calculator Framework**

To calculate Equated Monthly Installments (EMI), we use the standard formula:
\`\`\`
EMI = [P x R x (1+R)^N]/[((1+R)^N)-1]
\`\`\`
Where:
- **P** = Principal loan amount
- **R** = Monthly interest rate (Annual Rate / 12 / 100)
- **N** = Loan tenure in months

For example, on a Home Loan of **PKR 10,000,000** at **8.5%** for **20 years** (240 months):
- Monthly Principal + Interest: **PKR 86,782**
- Total Interest Payable: **PKR 10,827,761**
- Total Repayment Amount: **PKR 20,827,761**

Would you like to simulate a personal or business loan emi calculation?`,
      followups: ['EMI Calculator Tool', 'Interest Rates Schedule', 'DTI Threshold check', 'Apply for Home Loan'],
      contextTag: 'EMI Calculation',
    };
  }

  return MOCK_RESPONSES.default;
}

// Generate premium banking titles dynamically
function generateTitleFromText(text: string): string {
  const l = text.toLowerCase();
  if (l.includes('home loan') || l.includes('house loan')) return 'Home Loan Guidance';
  if (l.includes('personal loan') || l.includes('unsecured')) return 'Personal Loan Eligibility';
  if (l.includes('business loan') || l.includes('commercial')) return 'Business Loan Analysis';
  if (l.includes('emi') || l.includes('calculat')) return 'EMI Calculation';
  if (l.includes('kyc') || l.includes('complian') || l.includes('aml')) return 'Compliance Checklist';
  if (l.includes('risk') || l.includes('npl') || l.includes('warning')) return 'Risk Assessment Review';
  if (l.includes('track') || l.includes('status') || l.includes('application')) return 'Timeline Tracking';
  if (l.includes('document')) return 'Document Matrix Review';
  
  // Default to a 3-4 word clean title
  const words = text.trim().split(/\s+/).slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(' ') || 'General Inquiries';
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AIContext = createContext<AIContextValue | null>(null);

export function useAI(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used inside AIProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<WidgetMode>('closed');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [status, setStatus] = useState<AIStatus>('ready');
  const [activeMode, setActiveModeState] = useState<AIMode>('general');
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages ?? [];

  const isStreaming = status === 'processing' || status === 'responding';

  // ── Mode Switcher ────────────────────────────────────────────────────────────
  const setActiveMode = useCallback((mode: AIMode) => {
    setActiveModeState(mode);
    // If there is an active conversation with no messages, switch its mode
    if (activeConvId) {
      setConversations(prev =>
        prev.map(c => (c.id === activeConvId && c.messages.length === 0 ? { ...c, mode } : c))
      );
    }
  }, [activeConvId]);

  // ── Widget controls ──────────────────────────────────────────────────────────

  const open = useCallback(() => setMode('widget'), []);
  const close = useCallback(() => setMode('closed'), []);
  const expand = useCallback(() => setMode('fullscreen'), []);
  const collapse = useCallback(() => setMode('widget'), []);
  const toggle = useCallback(() =>
    setMode(m => (m === 'closed' ? 'widget' : 'closed')), []);

  // ── Conversation controls ────────────────────────────────────────────────────

  const newConversation = useCallback((initialMode?: AIMode): string => {
    const id = `conv-${Date.now()}`;
    const targetMode = initialMode || activeMode;
    setConversations(prev => [
      { id, title: 'New Conversation', messages: [], createdAt: new Date(), mode: targetMode },
      ...prev,
    ]);
    setActiveConvId(id);
    setActiveModeState(targetMode);
    setStatus('ready');
    return id;
  }, [activeMode]);

  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id);
    const conv = conversations.find(c => c.id === id);
    if (conv) setActiveModeState(conv.mode);
    setStatus('ready');
  }, [conversations]);

  // ── Send message with dynamic multi-stage streaming simulation ───────────────

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return;

    // Ensure we have an active conversation
    let convId = activeConvId;
    const currentMode = activeMode;
    if (!convId || !conversations.find(c => c.id === convId)) {
      const id = `conv-${Date.now()}`;
      convId = id;
      setConversations(prev => [
        {
          id,
          title: generateTitleFromText(text),
          messages: [],
          createdAt: new Date(),
          mode: currentMode,
        },
        ...prev,
      ]);
      setActiveConvId(id);
    }

    const userMsgId = `msg-${Date.now()}-user`;
    const asstMsgId = `msg-${Date.now()}-asst`;

    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    // Add user message + assistant thinking placeholder
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== convId) return c;
        const updatedTitle = c.messages.length === 0 ? generateTitleFromText(text) : c.title;
        return {
          ...c,
          title: updatedTitle,
          messages: [
            ...c.messages,
            userMsg,
            {
              id: asstMsgId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              thinking: true,
            },
          ],
        };
      })
    );

    // 1. Stage: Thinking (Processing)
    setStatus('processing');

    const config = getMockResponse(text, currentMode);
    const fullResponse = config.text;

    // Transition 1: Thinking -> Typing dots after 800ms
    streamTimerRef.current = setTimeout(() => {
      // Set to typing dots state
      setConversations(prev =>
        prev.map(c =>
          c.id !== convId
            ? c
            : {
                ...c,
                messages: c.messages.map(m =>
                  m.id === asstMsgId ? { ...m, thinking: false, typing: true } : m
                ),
              }
        )
      );
      setStatus('responding');

      // Transition 2: Typing dots -> Character Stream after another 800ms
      streamTimerRef.current = setTimeout(() => {
        setConversations(prev =>
          prev.map(c =>
            c.id !== convId
              ? c
              : {
                  ...c,
                  messages: c.messages.map(m =>
                    m.id === asstMsgId ? { ...m, typing: false, streaming: true } : m
                  ),
                }
          )
        );

        let charIndex = 0;
        const CHUNK = 8;
        const DELAY = 16;

        const doStream = () => {
          if (charIndex >= fullResponse.length) {
            // Finished streaming
            setConversations(prev =>
              prev.map(c =>
                c.id !== convId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map(m =>
                        m.id === asstMsgId
                          ? {
                              ...m,
                              content: fullResponse,
                              streaming: false,
                              followups: config.followups,
                              contextTag: config.contextTag,
                            }
                          : m
                      ),
                    }
              )
            );
            setStatus('ready');
            return;
          }

          const nextIndex = Math.min(charIndex + CHUNK, fullResponse.length);
          const partial = fullResponse.slice(0, nextIndex);
          charIndex = nextIndex;

          setConversations(prev =>
            prev.map(c =>
              c.id !== convId
                ? c
                : {
                    ...c,
                    messages: c.messages.map(m =>
                      m.id === asstMsgId ? { ...m, content: partial } : m
                    ),
                  }
            )
          );

          streamTimerRef.current = setTimeout(doStream, DELAY);
        };

        doStream();
      }, 800);
    }, 800);

  }, [activeConvId, activeMode, conversations, isStreaming]);

  const stopStreaming = useCallback(() => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    setConversations(prev =>
      prev.map(c => ({
        ...c,
        messages: c.messages.map(m =>
          m.thinking || m.typing || m.streaming
            ? { ...m, thinking: false, typing: false, streaming: false, content: m.content || 'Interrupted by user.' }
            : m
        ),
      }))
    );
    setStatus('ready');
  }, []);

  const setFeedback = useCallback((msgId: string, type: FeedbackType) => {
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
  }, []);

  return (
    <AIContext.Provider
      value={{
        mode,
        open,
        close,
        expand,
        collapse,
        toggle,
        conversations,
        activeConvId,
        activeConv,
        messages,
        status,
        activeMode,
        setActiveMode,
        newConversation,
        selectConversation,
        sendMessage,
        stopStreaming,
        setFeedback,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}
