'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

/* ─── tiny counter hook ─── */
function useCountUp(target: number, duration = 1800, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration, started]);
  return value;
}

export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [dashVisible, setDashVisible] = useState(false);
  const dashRef = useRef<HTMLDivElement>(null);

  /* intersection observer for count-up trigger */
  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setDashVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* animated KPI values */
  const loans   = useCountUp(2847, 1800, dashVisible);
  const pending = useCountUp(384,  1600, dashVisible);
  const rate    = useCountUp(87,   1400, dashVisible);

  /* disbursed ticks every 6 s */
  const [disbursed, setDisbursed] = useState(482);
  useEffect(() => {
    if (!dashVisible) return;
    const id = setInterval(() => setDisbursed(v => v + Math.floor(Math.random() * 3 + 1)), 6000);
    return () => clearInterval(id);
  }, [dashVisible]);

  /* scramble delta text every 6 s */
  const [scrambling, setScrambling] = useState(false);
  useEffect(() => {
    if (!dashVisible) return;
    const id = setInterval(() => {
      setScrambling(true);
      setTimeout(() => setScrambling(false), 600);
    }, 6000);
    return () => clearInterval(id);
  }, [dashVisible]);

  /* active step animation cycling */
  const [activeStep, setActiveStep] = useState(2);
  useEffect(() => {
    if (!dashVisible) return;
    const id = setInterval(() => setActiveStep(s => (s + 1) % 5), 2200);
    return () => clearInterval(id);
  }, [dashVisible]);

  /* ── pipeline ticker ── */
  const ALL_PIPELINE = [
    {name:'Rajesh Kumar',  type:'Home Loan · ₹45L',      badge:'Approved',    cls:'badge-approved',   initial:'R'},
    {name:'Priya Sharma',  type:'Business Loan · ₹12L',   badge:'In Review',   cls:'badge-review',     initial:'P'},
    {name:'Amit Patel',    type:'Personal Loan · ₹5L',    badge:'Processing',  cls:'badge-processing', initial:'A'},
    {name:'Sunita Verma',  type:'Auto Loan · ₹8L',        badge:'Pending Docs',cls:'badge-pending',    initial:'S'},
    {name:'Kiran Reddy',   type:'MSME Loan · ₹28L',       badge:'Approved',    cls:'badge-approved',   initial:'K'},
    {name:'Meena Nair',    type:'Home Loan · ₹62L',       badge:'Processing',  cls:'badge-processing', initial:'M'},
    {name:'Arjun Singh',   type:'Business Loan · ₹9L',    badge:'In Review',   cls:'badge-review',     initial:'A'},
    {name:'Deepa Pillai',  type:'Personal Loan · ₹3L',    badge:'Approved',    cls:'badge-approved',   initial:'D'},
  ];
  const [pipelineStart, setPipelineStart] = useState(0);
  const [pipelineAnim, setPipelineAnim] = useState<'idle'|'exit'|'enter'>('idle');
  useEffect(() => {
    if (!dashVisible) return;
    const id = setInterval(() => {
      setPipelineAnim('exit');
      setTimeout(() => {
        setPipelineStart(s => (s + 1) % ALL_PIPELINE.length);
        setPipelineAnim('enter');
        setTimeout(() => setPipelineAnim('idle'), 500);
      }, 320);
    }, 2800);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashVisible]);

  const faqs = [
    { question: 'What types of loans does Fortress Banking LOS support?', answer: 'Fortress Banking supports the full spectrum — home loans, personal loans, business loans, auto loans, MSME financing, agriculture loans, and more. The platform is configurable to match your product catalog and lending policies.' },
    { question: 'How does the AI credit assessment work?', answer: 'Our AI engine integrates with major bureaus (CIBIL, Experian, CRIF), pulls real-time bank statements via AA framework, and runs proprietary ML models to generate a risk score alongside human-readable recommendations — all within seconds.' },
    { question: 'Is the platform compliant with RBI and SEBI regulations?', answer: 'Yes. Fortress Banking maintains built-in compliance rulesets aligned to RBI master directions, SEBI guidelines, AML/KYC norms, and DPDPA data privacy requirements. Our compliance engine is updated regularly with regulatory changes.' },
    { question: 'Can we integrate with our existing core banking system?', answer: 'Absolutely. Fortress Banking offers pre-built connectors for Finacle, Flexcube, Temenos, and other leading CBS platforms. We also provide REST APIs and webhooks for custom integrations.' },
    { question: 'What is the typical deployment timeline?', answer: 'Most institutions go live within 8–12 weeks. This includes environment setup, configuration, data migration, user training, and UAT. We assign a dedicated implementation team to ensure a smooth rollout.' },
    { question: 'How is data security ensured?', answer: 'We implement AES-256 encryption at rest and in transit, role-based access control, OTP-based login, IP whitelisting, complete audit trails, and are ISO 27001 certified. Your data is hosted on SOC-2 compliant cloud infrastructure.' },
  ];

  const d = dark; /* shorthand */

  return (
    <div data-theme={dark ? 'dark' : 'light'} style={{minHeight:'100vh', fontFamily:"'Inter', system-ui, -apple-system, sans-serif"}}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; }
        img { display: block; max-width: 100%; }
        ul { list-style: none; }

        /* ══════════════ LIGHT TOKENS ══════════════ */
        [data-theme="light"] {
          --primary: #1D4ED8;
          --primary-dark: #1741B0;
          --primary-light: #EFF6FF;
          --navy: #0F172A;
          --navy-mid: #1E293B;
          --bg: #F8FAFC;
          --bg2: #F1F5F9;
          --white: #FFFFFF;
          --border: #E2E8F0;
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-muted: #94A3B8;
          --success: #10B981;
          --warning: #F59E0B;
          --nav-bg: rgba(255,255,255,0.92);
          --card-bg: #FFFFFF;
          --panel-bg: #FFFFFF;
          --db-body: #F1F5F9;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04);
          --shadow-lg: 0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06);
          --shadow-xl: 0 20px 60px rgba(15,23,42,0.13), 0 4px 16px rgba(15,23,42,0.08);
          --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;
        }
        /* ══════════════ DARK TOKENS ══════════════ */
        [data-theme="dark"] {
          --primary: #3B82F6;
          --primary-dark: #2563EB;
          --primary-light: rgba(59,130,246,0.12);
          --navy: #F1F5F9;
          --navy-mid: #E2E8F0;
          --bg: #0A0F1E;
          --bg2: #111827;
          --white: #111827;
          --border: #1E2D45;
          --text-primary: #F1F5F9;
          --text-secondary: #94A3B8;
          --text-muted: #475569;
          --success: #10B981;
          --warning: #F59E0B;
          --nav-bg: rgba(10,15,30,0.92);
          --card-bg: #141C2E;
          --panel-bg: #141C2E;
          --db-body: #0D1424;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.35);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
          --shadow-xl: 0 20px 60px rgba(0,0,0,0.5);
          --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;
        }

        body-override, [data-theme] {
          background: var(--bg);
          color: var(--text-primary);
          transition: background 0.35s ease, color 0.35s ease;
        }

        /* ─── THEME TOGGLE ─── */
        .theme-toggle {
          width: 40px; height: 22px; border-radius: 100px;
          border: 1px solid var(--border);
          background: var(--bg2);
          cursor: pointer; position: relative;
          transition: background 0.3s, border-color 0.3s;
          flex-shrink: 0;
        }
        .theme-toggle.on { background: var(--primary); border-color: var(--primary); }
        .theme-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform 0.25s cubic-bezier(.4,0,.2,1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .theme-toggle.on .theme-toggle-thumb { transform: translateX(18px); }
        .theme-toggle-icon { width: 10px; height: 10px; }

        /* ─── NAV ─── */
        #nav {
          position: sticky; top: 0; z-index: 100;
          background: var(--nav-bg);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          transition: background 0.35s, border-color 0.35s;
        }
        #nav-inner {
          max-width: 1320px; margin: 0 auto; padding: 0 40px;
          height: 64px; display: flex; align-items: center;
        }
        #nav-logo { display: flex; align-items: center; gap: 10px; margin-right: 48px; }
        .logo-icon {
          width: 34px; height: 34px; background: var(--primary);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
        }
        .logo-icon svg { width: 18px; height: 18px; color: #fff; }
        .logo-text { font-size: 17px; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; white-space: nowrap; transition: color 0.35s; }
        #nav-links { display: flex; align-items: center; gap: 4px; flex: 1; }
        .nav-link {
          padding: 6px 14px; font-size: 14px; font-weight: 500;
          color: var(--text-secondary); border-radius: var(--radius-sm);
          cursor: pointer; white-space: nowrap; transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: var(--navy); background: var(--bg2); }
        #nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .btn-ghost {
          padding: 7px 16px; font-size: 13px; font-weight: 500;
          color: var(--text-secondary); border-radius: var(--radius-sm);
          cursor: pointer; white-space: nowrap;
          border: 1px solid var(--border); background: transparent;
          transition: all 0.2s;
        }
        .btn-ghost:hover { color: var(--navy); background: var(--bg2); border-color: var(--text-muted); }
        .btn-outline {
          padding: 7px 16px; font-size: 13px; font-weight: 500;
          color: var(--primary); border-radius: var(--radius-sm);
          cursor: pointer; white-space: nowrap;
          border: 1px solid var(--primary); background: transparent; transition: all 0.2s;
        }
        .btn-outline:hover { background: var(--primary-light); }

        /* ─── HERO ─── */
        #hero { background: var(--card-bg); padding: 96px 40px 80px; overflow: hidden; position: relative; transition: background 0.35s; }
        #hero::before {
          content: ''; position: absolute; top: -120px; right: -200px;
          width: 700px; height: 700px;
          background: radial-gradient(ellipse at center, rgba(59,130,246,0.09) 0%, transparent 70%);
          pointer-events: none;
        }
        #hero-inner { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--primary-light); border: 1px solid rgba(59,130,246,0.25);
          border-radius: 100px; padding: 5px 14px; margin-bottom: 28px;
          animation: badgePulse 3s ease-in-out infinite;
        }
        @keyframes badgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.15)} 50%{box-shadow:0 0 0 6px rgba(59,130,246,0)} }
        .hero-badge span { font-size: 12px; font-weight: 600; color: var(--primary); letter-spacing: 0.3px; text-transform: uppercase; }
        .badge-dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; animation: dotBlink 1.5s ease-in-out infinite; }
        @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        #hero-headline { font-size: 56px; font-weight: 800; color: var(--navy); line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 24px; transition: color 0.35s; }
        #hero-headline .highlight { color: var(--primary); }
        #hero-subtitle { font-size: 17px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 40px; max-width: 520px; transition: color 0.35s; }
        #hero-ctas { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
        .cta-primary {
          padding: 14px 28px; font-size: 15px; font-weight: 600; color: #fff;
          background: var(--primary); border-radius: var(--radius-md); border: none;
          cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,0.35);
          display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .cta-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(59,130,246,0.45); }
        .cta-secondary {
          padding: 14px 28px; font-size: 15px; font-weight: 600;
          color: var(--navy); background: var(--card-bg); border-radius: var(--radius-md);
          border: 1.5px solid var(--border); cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
          transition: border-color 0.2s, background 0.2s, color 0.35s;
        }
        .cta-secondary:hover { border-color: var(--text-muted); background: var(--bg2); }
        #hero-bullets { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .hero-bullet { display: flex; align-items: center; gap: 10px; }
        .bullet-icon { width: 20px; height: 20px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bullet-icon svg { width: 11px; height: 11px; color: var(--primary); }
        .hero-bullet span { font-size: 13px; font-weight: 600; color: var(--navy); transition: color 0.35s; }

        /* ─── DASHBOARD MOCKUP ─── */
        #hero-right { position: relative; }
        #hero-dashboard {
          background: var(--card-bg); border-radius: var(--radius-xl);
          border: 1px solid var(--border); box-shadow: var(--shadow-xl);
          overflow: hidden; transition: background 0.35s, border-color 0.35s;
        }
        .dashboard-header { background: #0F172A; padding: 16px 20px; display: flex; align-items: center; gap: 8px; }
        [data-theme="dark"] .dashboard-header { background: #020817; }
        .dash-dot { width: 10px; height: 10px; border-radius: 50%; }
        .dash-dot.red { background: #FF5F57; }
        .dash-dot.yellow { background: #FEBC2E; }
        .dash-dot.green { background: #28C840; }
        .dashboard-header-title { margin-left: 12px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6); letter-spacing: 0.5px; }
        .dashboard-body { padding: 20px; background: var(--db-body); transition: background 0.35s; }
        .db-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
        .db-kpi {
          background: var(--panel-bg); border-radius: var(--radius-md); padding: 14px;
          border: 1px solid var(--border); transition: background 0.35s, border-color 0.35s;
        }
        .db-kpi-label { font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .db-kpi-value {
          font-size: 20px; font-weight: 800; color: var(--navy); letter-spacing: -0.5px;
          transition: color 0.35s; font-variant-numeric: tabular-nums;
        }
        .db-kpi-delta { font-size: 10px; font-weight: 600; margin-top: 2px; }
        .db-main-row { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; margin-bottom: 14px; }
        .db-panel { background: var(--panel-bg); border-radius: var(--radius-md); border: 1px solid var(--border); padding: 14px; transition: background 0.35s, border-color 0.35s; }
        .db-panel-title { font-size: 11px; font-weight: 700; color: var(--navy); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.35s; }
        .pipeline-item { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--bg2); }
        .pipeline-item:last-child { border-bottom: none; }
        .pipeline-avatar { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
        .pipeline-info { flex: 1; min-width: 0; }
        .pipeline-name { font-size: 11px; font-weight: 600; color: var(--navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.35s; }
        .pipeline-type { font-size: 10px; color: var(--text-muted); }
        .pipeline-badge { font-size: 9px; font-weight: 600; padding: 2px 7px; border-radius: 100px; white-space: nowrap; position: relative; overflow: hidden; }
        .badge-review { background: #FEF3C7; color: #92400E; }
        .badge-approved { background: #D1FAE5; color: #065F46; }
        .badge-processing { background: #DBEAFE; color: #1E40AF; }
        .badge-pending { background: #F3F4F6; color: #6B7280; }
        [data-theme="dark"] .badge-review { background: rgba(245,158,11,0.15); color: #FCD34D; }
        [data-theme="dark"] .badge-approved { background: rgba(16,185,129,0.15); color: #34D399; }
        [data-theme="dark"] .badge-processing { background: rgba(59,130,246,0.15); color: #60A5FA; }
        [data-theme="dark"] .badge-pending { background: rgba(100,116,139,0.15); color: #94A3B8; }

        /* badge shimmer sweep */
        @keyframes badgeShimmer { 0%{left:-100%} 100%{left:200%} }
        .badge-shimmer::after {
          content:''; position:absolute; top:0; left:-100%; width:60%;
          height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);
          animation: badgeShimmer 1.8s ease-in-out infinite;
        }

        /* pipeline row enter/exit */
        .db-panel { overflow: hidden; }
        @keyframes rowSlideOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-18px)} }
        @keyframes rowSlideIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowFadeIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes newRowFlash { 0%,100%{background:transparent} 30%{background:rgba(16,185,129,0.08)} }
        .pipeline-row-exit  { animation: rowSlideOut 0.3s ease-in  forwards; }
        .pipeline-row-enter { animation: rowSlideIn  0.4s ease-out forwards; }
        .pipeline-row-init  { animation: rowFadeIn   0.5s ease-out both; }
        .pipeline-row-new   { animation: newRowFlash 1.2s ease-out; border-radius: 6px; }
        .credit-score-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .credit-bar-wrap { flex: 1; height: 6px; background: var(--bg2); border-radius: 3px; overflow: hidden; }
        .credit-bar { height: 6px; border-radius: 3px; }
        .credit-label { font-size: 10px; color: var(--text-secondary); font-weight: 500; width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .credit-score-num { font-size: 10px; font-weight: 700; color: var(--navy); width: 28px; text-align: right; transition: color 0.35s; }
        .db-bottom-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .mini-panel { background: var(--panel-bg); border-radius: var(--radius-md); border: 1px solid var(--border); padding: 12px; transition: background 0.35s, border-color 0.35s; }
        .mini-panel-title { font-size: 10px; font-weight: 700; color: var(--navy); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.35s; }
        .approval-step { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; transition: opacity 0.4s; }
        .step-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: all 0.4s; }
        .step-dot.done { background: var(--success); }
        .step-dot.active { background: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.25); animation: stepPulse 1s ease-in-out infinite; }
        @keyframes stepPulse { 0%,100%{box-shadow:0 0 0 3px rgba(59,130,246,0.25)} 50%{box-shadow:0 0 0 5px rgba(59,130,246,0.1)} }
        .step-dot.idle { background: var(--border); }
        .step-label { font-size: 10px; color: var(--text-secondary); font-weight: 500; }
        .doc-item { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
        .doc-icon { width: 20px; height: 20px; background: var(--primary-light); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .doc-icon svg { width: 11px; height: 11px; color: var(--primary); }
        .doc-name { font-size: 10px; color: var(--text-secondary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .notif-item { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px; }
        .notif-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
        .notif-text { font-size: 10px; color: var(--text-secondary); line-height: 1.4; }

        /* ─── FLOATING BADGES ─── */
        .floating-badge {
          position: absolute; background: var(--card-bg); border-radius: var(--radius-md);
          border: 1px solid var(--border); box-shadow: var(--shadow-lg);
          padding: 10px 16px; display: flex; align-items: center; gap: 10px;
          transition: background 0.35s, border-color 0.35s;
        }
        .floating-badge.top-left { top: -20px; left: -30px; animation: floatA 4s ease-in-out infinite; }
        .floating-badge.bottom-right { bottom: -20px; right: -24px; animation: floatB 4.5s ease-in-out infinite; }
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        .float-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
        .float-icon svg { width: 18px; height: 18px; }
        .float-label { font-size: 10px; color: var(--text-muted); }
        .float-value { font-size: 15px; font-weight: 800; color: var(--navy); transition: color 0.35s; }

        /* ─── APPROVAL RATE ICON BOUNCE ─── */
        @keyframes arrowBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .bounce-arrow { animation: arrowBounce 1.4s ease-in-out infinite; display:inline-flex; }

        /* ─── PROGRESS BAR SWEEP ─── */
        @keyframes barSweep { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .bar-sweep {
          height: 4px; border-radius: 2px;
          background: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 30%, #10B981 60%, #1D4ED8 100%);
          background-size: 200% 100%;
          animation: barSweep 2.4s linear infinite;
        }
        .bar-sweep-6 {
          height: 6px; border-radius: 3px;
          background: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 40%, #1D4ED8 100%);
          background-size: 200% 100%;
          animation: barSweep 2s linear infinite;
        }

        /* ─── SCRAMBLE (for delta text) ─── */
        @keyframes scramble { 0%,100%{opacity:1} 30%,70%{opacity:0.4} 50%{opacity:0.1} }
        .scrambling { animation: scramble 0.6s ease-in-out; }

        /* ─── GLOW on KPI card ─── */
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0)} 50%{box-shadow:0 0 20px 6px rgba(59,130,246,0.18)} }
        .kpi-glow { animation: glowPulse 3s ease-in-out infinite; }

        /* ─── TRUSTED ─── */
        #trusted { background: var(--card-bg); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 36px 40px; transition: background 0.35s, border-color 0.35s; }
        #trusted-inner { max-width: 1320px; margin: 0 auto; display: flex; align-items: center; gap: 48px; }
        #trusted-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
        #trusted-logos { display: flex; align-items: center; gap: 48px; flex: 1; }
        .trusted-logo { display: flex; align-items: center; gap: 10px; }
        .trusted-logo-icon { width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
        .trusted-logo-icon svg { width: 20px; height: 20px; color: var(--text-muted); }
        .trusted-logo-text { font-size: 15px; font-weight: 700; color: var(--text-muted); letter-spacing: -0.3px; }

        /* ─── FEATURES ─── */
        #features { padding: 112px 40px; background: var(--bg); transition: background 0.35s; }
        #features-inner { max-width: 1320px; margin: 0 auto; }
        .section-eyebrow { font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }
        .section-title { font-size: 42px; font-weight: 800; color: var(--navy); letter-spacing: -1px; line-height: 1.15; margin-bottom: 16px; transition: color 0.35s; }
        .section-subtitle { font-size: 17px; color: var(--text-secondary); max-width: 560px; line-height: 1.7; margin-bottom: 64px; transition: color 0.35s; }
        #features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .feature-card {
          background: var(--card-bg); border-radius: var(--radius-lg); border: 1px solid var(--border);
          padding: 32px 28px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s, background 0.35s, border-color 0.35s;
        }
        .feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .feature-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 3px; background: linear-gradient(90deg, var(--primary), #60A5FA); opacity: 0; transition: opacity 0.2s;
        }
        .feature-card.active-card::before, .feature-card:hover::before { opacity: 1; }
        .feature-icon-wrap { width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--primary-light); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .feature-icon-wrap svg { width: 22px; height: 22px; color: var(--primary); }
        .feature-title { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 10px; letter-spacing: -0.2px; transition: color 0.35s; }
        .feature-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.65; transition: color 0.35s; }

        /* ─── JOURNEY ─── */
        #journey { padding: 112px 40px; background: #0F172A; position: relative; overflow: hidden; }
        [data-theme="dark"] #journey { background: #020817; }
        #journey::before {
          content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 600px;
          background: radial-gradient(ellipse at center, rgba(59,130,246,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        #journey-inner { max-width: 1320px; margin: 0 auto; position: relative; }
        #journey-inner .section-title { color: #F1F5F9; }
        #journey-inner .section-eyebrow { color: #60A5FA; }
        #journey-inner .section-subtitle { color: #64748B; }
        #journey-steps { display: flex; align-items: flex-start; gap: 0; justify-content: space-between; position: relative; }
        #journey-steps::before {
          content: ''; position: absolute; top: 32px; left: 5%; right: 5%;
          height: 2px; background: linear-gradient(90deg, var(--primary), #60A5FA, var(--primary)); z-index: 0;
        }
        .journey-step { display: flex; flex-direction: column; align-items: center; gap: 16px; flex: 1; position: relative; z-index: 1; }
        .journey-step-num { width: 64px; height: 64px; border-radius: 50%; background: #0F172A; border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: var(--primary); box-shadow: 0 0 0 6px rgba(59,130,246,0.12); }
        [data-theme="dark"] .journey-step-num { background: #020817; }
        .journey-step-num.active { background: var(--primary); color: #fff; box-shadow: 0 0 0 6px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.4); }
        .journey-step-label { font-size: 13px; font-weight: 700; color: #F1F5F9; text-align: center; }
        .journey-step-desc { font-size: 11px; color: #64748B; text-align: center; line-height: 1.5; max-width: 110px; }

        /* ─── MODULES ─── */
        #modules { padding: 112px 40px; background: var(--card-bg); transition: background 0.35s; }
        #modules-inner { max-width: 1320px; margin: 0 auto; }
        #modules-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .module-card {
          background: var(--bg); border-radius: var(--radius-lg); border: 1px solid var(--border);
          padding: 28px 24px; display: flex; flex-direction: column; gap: 16px;
          transition: box-shadow 0.2s, transform 0.2s, background 0.35s, border-color 0.35s;
        }
        .module-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .module-card.featured { background: var(--primary); border-color: var(--primary); }
        .module-icon-wrap { width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--card-bg); display: flex; align-items: center; justify-content: center; }
        .module-icon-wrap svg { width: 20px; height: 20px; }
        .module-card.featured .module-icon-wrap { background: rgba(255,255,255,0.2); }
        .module-title { font-size: 15px; font-weight: 700; color: var(--navy); letter-spacing: -0.2px; transition: color 0.35s; }
        .module-card.featured .module-title { color: #fff; }
        .module-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; transition: color 0.35s; }
        .module-card.featured .module-desc { color: rgba(255,255,255,0.75); }
        .module-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .module-tag { font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 100px; background: var(--card-bg); color: var(--text-secondary); border: 1px solid var(--border); transition: background 0.35s, border-color 0.35s, color 0.35s; }
        .module-card.featured .module-tag { background: rgba(255,255,255,0.2); color: #fff; border-color: transparent; }

        /* ─── SECURITY ─── */
        #security { padding: 112px 40px; background: var(--bg); transition: background 0.35s; }
        #security-inner { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 96px; align-items: center; }
        #security-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 48px; }
        .security-item { background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: background 0.35s, border-color 0.35s; }
        .security-item-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--primary-light); display: flex; align-items: center; justify-content: center; }
        .security-item-icon svg { width: 20px; height: 20px; color: var(--primary); }
        .security-item-title { font-size: 13px; font-weight: 700; color: var(--navy); transition: color 0.35s; }
        .security-item-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; transition: color 0.35s; }
        #metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .metric-card { background: var(--card-bg); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 32px 28px; box-shadow: var(--shadow-md); transition: background 0.35s, border-color 0.35s; }
        .metric-value { font-size: 44px; font-weight: 900; color: var(--navy); letter-spacing: -2px; line-height: 1; margin-bottom: 8px; transition: color 0.35s; }
        .metric-unit { font-size: 22px; font-weight: 700; color: var(--primary); }
        .metric-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; margin-bottom: 16px; transition: color 0.35s; }
        .metric-bar-wrap { height: 4px; background: var(--bg2); border-radius: 2px; overflow: hidden; }
        .metric-bar { height: 4px; border-radius: 2px; background: linear-gradient(90deg, var(--primary), #60A5FA); }
        .metric-trend { font-size: 11px; font-weight: 600; color: var(--success); margin-top: 8px; }

        /* ─── TESTIMONIALS ─── */
        #testimonials { padding: 112px 40px; background: var(--card-bg); transition: background 0.35s; }
        #testimonials-inner { max-width: 1320px; margin: 0 auto; }
        #testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 64px; }
        .testimonial-card { background: var(--bg); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 36px 32px; display: flex; flex-direction: column; gap: 24px; position: relative; transition: background 0.35s, border-color 0.35s; }
        .testimonial-card.featured-t { background: #0F172A; border-color: #0F172A; }
        [data-theme="dark"] .testimonial-card.featured-t { background: #020817; border-color: #1E2D45; }
        .testimonial-quote { font-size: 15px; color: var(--text-secondary); line-height: 1.75; flex: 1; transition: color 0.35s; }
        .testimonial-card.featured-t .testimonial-quote { color: #64748B; }
        .testimonial-stars { display: flex; gap: 3px; margin-bottom: 4px; }
        .star { color: #F59E0B; font-size: 14px; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .author-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
        .author-name { font-size: 14px; font-weight: 700; color: var(--navy); transition: color 0.35s; }
        .testimonial-card.featured-t .author-name { color: #F1F5F9; }
        .author-role { font-size: 12px; color: var(--text-muted); transition: color 0.35s; }
        .testimonial-card.featured-t .author-role { color: #475569; }

        /* ─── FAQ ─── */
        #faq { padding: 112px 40px; background: var(--bg); transition: background 0.35s; }
        #faq-inner { max-width: 840px; margin: 0 auto; text-align: center; }
        #faq-inner .section-subtitle { max-width: 100%; }
        #faq-list { margin-top: 64px; display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .faq-item { background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; transition: border-color 0.2s, background 0.35s; }
        .faq-item.open { border-color: var(--primary); }
        .faq-question { padding: 20px 24px; font-size: 15px; font-weight: 600; color: var(--navy); display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; transition: color 0.2s; }
        .faq-item.open .faq-question { color: var(--primary); }
        .faq-question-icon { flex-shrink: 0; color: var(--text-muted); font-size: 20px; line-height: 1; transition: transform 0.2s; }
        .faq-item.open .faq-question-icon { transform: rotate(45deg); }
        .faq-answer { padding: 0 24px 20px; font-size: 14px; color: var(--text-secondary); line-height: 1.7; transition: color 0.35s; }

        /* ─── CTA ─── */
        #cta-section { padding: 96px 40px; background: var(--card-bg); transition: background 0.35s; }
        #cta-inner {
          max-width: 1320px; margin: 0 auto;
          background: linear-gradient(135deg, #0F172A 0%, #1e3a8a 100%);
          border-radius: var(--radius-xl); padding: 80px;
          display: flex; align-items: center; justify-content: space-between; gap: 48px;
          position: relative; overflow: hidden;
        }
        [data-theme="dark"] #cta-inner { background: linear-gradient(135deg, #020817 0%, #0F172A 100%); border: 1px solid #1E2D45; }
        #cta-inner::before { content: ''; position: absolute; top: -100px; right: -100px; width: 500px; height: 500px; background: radial-gradient(ellipse, rgba(59,130,246,0.35) 0%, transparent 70%); }
        #cta-left { position: relative; }
        #cta-left h2 { font-size: 40px; font-weight: 800; color: #F1F5F9; letter-spacing: -1px; margin-bottom: 16px; line-height: 1.2; }
        #cta-left p { font-size: 16px; color: #64748B; max-width: 500px; line-height: 1.7; }
        #cta-actions { display: flex; gap: 12px; flex-shrink: 0; position: relative; }
        .cta-btn-white { padding: 14px 28px; font-size: 15px; font-weight: 600; color: #0F172A; background: #fff; border-radius: var(--radius-md); border: none; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: transform 0.15s, box-shadow 0.2s; }
        .cta-btn-white:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
        .cta-btn-glass { padding: 14px 28px; font-size: 15px; font-weight: 600; color: #fff; background: rgba(255,255,255,0.1); border-radius: var(--radius-md); border: 1.5px solid rgba(255,255,255,0.2); cursor: pointer; white-space: nowrap; backdrop-filter: blur(8px); transition: background 0.2s; }
        .cta-btn-glass:hover { background: rgba(255,255,255,0.18); }

        /* ─── FOOTER ─── */
        #footer { background: #0F172A; padding: 72px 40px 40px; }
        [data-theme="dark"] #footer { background: #020817; }
        #footer-inner { max-width: 1320px; margin: 0 auto; }
        #footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 64px; }
        #footer-brand .brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo-icon-f { width: 32px; height: 32px; background: var(--primary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
        .logo-icon-f svg { width: 16px; height: 16px; color: #fff; }
        .logo-text-f { font-size: 16px; font-weight: 700; color: #F1F5F9; }
        #footer-brand p { font-size: 13px; color: #475569; line-height: 1.7; max-width: 280px; margin-bottom: 24px; }
        .footer-col-title { font-size: 12px; font-weight: 700; color: #F1F5F9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        .footer-links { display: flex; flex-direction: column; gap: 10px; }
        .footer-link { font-size: 13px; color: #475569; cursor: pointer; font-weight: 500; transition: color 0.2s; }
        .footer-link:hover { color: #64748B; }
        #footer-bottom { border-top: 1px solid #1E293B; padding-top: 32px; display: flex; align-items: center; justify-content: space-between; }
        #footer-copy { font-size: 12px; color: #334155; }
        #footer-legal { display: flex; gap: 24px; }
        .footer-legal-link { font-size: 12px; color: #334155; cursor: pointer; }

      `}</style>

      {/* ══ NAVIGATION ══ */}
      <nav id="nav">
        <div id="nav-inner">
          <div id="nav-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="logo-text">Fortress Banking</span>
          </div>
          <div id="nav-links">
            {['Products','Features','Solutions','Resources','About','Contact'].map(item => (
              <a key={item} className="nav-link" href="#features">{item}</a>
            ))}
          </div>
          <div id="nav-actions">
            {/* ── THEME TOGGLE ── */}
            <button
              aria-label="Toggle dark mode"
              className={`theme-toggle${dark ? ' on' : ''}`}
              onClick={() => setDark(v => !v)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-toggle-thumb">
                {dark ? (
                  /* moon */
                  <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  /* sun */
                  <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )}
              </span>
            </button>
            <Link href="/login" className="btn-ghost">Employee Login</Link>
            <Link href="/customer/login" className="btn-outline">Customer Portal</Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section id="hero">
        <div id="hero-inner">
          {/* Left */}
          <div id="hero-left">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>AI-Powered Lending Platform</span>
            </div>
            <h1 id="hero-headline">
              Enterprise <span className="highlight">Loan Origination</span> Platform
            </h1>
            <p id="hero-subtitle">
              Digitize the complete lending lifecycle—from application intake and AI-assisted underwriting to approval, document management, customer self-service, and loan disbursement.
            </p>
            <div id="hero-ctas">
              <a href="#cta-section" className="cta-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Request Demo
              </a>
              <a href="#features" className="cta-secondary">
                Explore Platform
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
            <div id="hero-bullets" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              {[
                {label:'AI Assisted Decisioning'},
                {label:'Cloud Native'},
                {label:'Enterprise Security'},
                {label:'Paperless Processing'},
              ].map(({label}) => (
                <div key={label} className="hero-bullet">
                  <div className="bullet-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Animated Dashboard */}
          <div id="hero-right" ref={dashRef}>
            {/* Floating badge top-left */}
            <div className="floating-badge top-left">
              <div className="float-icon" style={{background:'#D1FAE5'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div>
                <div className="float-label">Approvals Today</div>
                <div className="float-value" style={{color:d?'#F1F5F9':undefined}}>
                  {dashVisible ? (
                    <span style={{display:'inline-block', transition:'all 0.3s'}}>
                      {scrambling ? Math.floor(Math.random()*20+130) : 142}
                    </span>
                  ) : '0'}
                </div>
              </div>
            </div>

            {/* Main Dashboard */}
            <div id="hero-dashboard">
              <div className="dashboard-header">
                <span className="dash-dot red"></span>
                <span className="dash-dot yellow"></span>
                <span className="dash-dot green"></span>
                <span className="dashboard-header-title">Fortress Banking — Loan Operations Dashboard</span>
              </div>
              <div className="dashboard-body">

                {/* KPI Row */}
                <div className="db-kpi-row">
                  {/* Active Loans — glows */}
                  <div className="db-kpi kpi-glow" style={{border:'1px solid rgba(59,130,246,0.3)'}}>
                    <div className="db-kpi-label">Active Loans</div>
                    <div className="db-kpi-value">{loans.toLocaleString()}</div>
                    <div className={`db-kpi-delta${scrambling?' scrambling':''}`} style={{color:'var(--success)'}}>↑ 12% this month</div>
                  </div>
                  {/* Pending Review */}
                  <div className="db-kpi">
                    <div className="db-kpi-label">Pending Review</div>
                    <div className="db-kpi-value">{pending}</div>
                    <div className={`db-kpi-delta${scrambling?' scrambling':''}`} style={{color:'var(--warning)'}}>↑ 8 today</div>
                  </div>
                  {/* Disbursed — live ticking */}
                  <div className="db-kpi">
                    <div className="db-kpi-label">Disbursed ₹ Cr</div>
                    <div className="db-kpi-value">₹{disbursed}</div>
                    <div className={`db-kpi-delta${scrambling?' scrambling':''}`} style={{color:'var(--success)'}}>↑ 23% QoQ</div>
                  </div>
                  {/* Approval Rate */}
                  <div className="db-kpi">
                    <div className="db-kpi-label">Approval Rate</div>
                    <div className="db-kpi-value" style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      {rate}%
                      <span className="bounce-arrow" style={{marginLeft:'2px'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12}}>
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                        </svg>
                      </span>
                    </div>
                    <div className={`db-kpi-delta${scrambling?' scrambling':''}`} style={{color:'var(--success)'}}>↑ 3% vs last wk</div>
                  </div>
                </div>

                {/* Main Row */}
                <div className="db-main-row">
                  {/* Loan Pipeline */}
                  <div className="db-panel">
                    <div className="db-panel-title" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      Loan Pipeline
                      {/* live pulse dot */}
                      <span style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'9px',fontWeight:600,color:'var(--success)'}}>
                        <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--success)',animation:'dotBlink 1.5s ease-in-out infinite',display:'inline-block'}}></span>
                        LIVE
                      </span>
                    </div>
                    {/* 4 visible rows: rotate through ALL_PIPELINE */}
                    {Array.from({length: 4}, (_, slot) => {
                      const idx = (pipelineStart + slot) % ALL_PIPELINE.length;
                      const p = ALL_PIPELINE[idx];
                      // last slot = newest entry when cycling
                      const isNew = slot === 3 && pipelineAnim !== 'idle';
                      const rowCls = [
                        'pipeline-item',
                        !dashVisible ? 'pipeline-row-init' : '',
                        dashVisible && pipelineAnim === 'exit'   && slot === 0 ? 'pipeline-row-exit'  : '',
                        dashVisible && pipelineAnim === 'enter'  && slot === 3 ? 'pipeline-row-enter' : '',
                        isNew ? 'pipeline-row-new' : '',
                      ].filter(Boolean).join(' ');
                      const initDelay = !dashVisible ? `${slot * 0.1}s` : '0s';
                      return (
                        <div
                          key={`${p.name}-${slot}`}
                          className={rowCls}
                          style={{animationDelay: initDelay}}
                        >
                          <div
                            className="pipeline-avatar"
                            style={{
                              background: d ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: '700', color: 'var(--primary)',
                              transition: 'background 0.35s',
                            }}
                          >
                            {p.initial}
                          </div>
                          <div className="pipeline-info">
                            <div className="pipeline-name">{p.name}</div>
                            <div className="pipeline-type">{p.type}</div>
                          </div>
                          {/* shimmer on Processing badge only */}
                          <div className={`pipeline-badge ${p.cls}${p.cls === 'badge-processing' ? ' badge-shimmer' : ''}`}>
                            {p.badge}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Credit Assessment */}
                  <div className="db-panel">
                    <div className="db-panel-title">AI Credit Assessment</div>
                    {[
                      {label:'Rajesh K.', width:'88%', gradient:'linear-gradient(90deg,#10B981,#34D399)', score:'782'},
                      {label:'Priya S.',  width:'72%', gradient:'linear-gradient(90deg,#3B82F6,#60A5FA)', score:'654'},
                      {label:'Amit P.',   width:'81%', gradient:'linear-gradient(90deg,#6366F1,#818CF8)', score:'718'},
                      {label:'Sunita V.', width:'60%', gradient:'linear-gradient(90deg,#F59E0B,#FCD34D)', score:'590'},
                    ].map((c, i) => (
                      <div key={c.label} className="credit-score-row">
                        <div className="credit-label">{c.label}</div>
                        <div className="credit-bar-wrap">
                          {/* animated sweep on first bar, static on others */}
                          {i === 0
                            ? <div className="bar-sweep-6" style={{width:c.width}}></div>
                            : <div className="credit-bar" style={{width:c.width, background:c.gradient}}></div>
                          }
                        </div>
                        <div className="credit-score-num">{c.score}</div>
                      </div>
                    ))}
                    <div style={{marginTop:'12px', borderTop:`1px solid ${d?'#1E2D45':'#F1F5F9'}`, paddingTop:'10px'}}>
                      <div style={{fontSize:'10px', fontWeight:'700', color:'var(--navy)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px', transition:'color 0.35s'}}>Approvals This Week</div>
                      <div style={{display:'flex', alignItems:'flex-end', gap:'4px', height:'32px'}}>
                        {[40,60,50,80,70,100,90].map((h, i) => (
                          <div key={i} style={{
                            flex:1, background:'var(--primary)',
                            opacity: 0.4 + i * 0.09,
                            height:`${h}%`, borderRadius:'2px',
                            animation:`barRise 0.6s ${i*0.08}s ease-out both`,
                          }}></div>
                        ))}
                      </div>
                      <style>{`@keyframes barRise{from{height:0}}`}</style>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="db-bottom-row">
                  {/* Approval Workflow — animated step */}
                  <div className="mini-panel">
                    <div className="mini-panel-title">Approval Workflow</div>
                    {[
                      {label:'Document Submitted'},
                      {label:'KYC Verified'},
                      {label:'Credit Check'},
                      {label:'Risk Assessment'},
                      {label:'Final Approval'},
                    ].map((s, idx) => {
                      const isDone = idx < activeStep;
                      const isActive = idx === activeStep;
                      return (
                        <div key={s.label} className="approval-step" style={{opacity: isDone || isActive ? 1 : 0.45}}>
                          <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : 'idle'}`}></div>
                          <div className="step-label" style={{color: isActive ? 'var(--primary)' : undefined, fontWeight: isActive ? 700 : undefined}}>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Documents */}
                  <div className="mini-panel">
                    <div className="mini-panel-title">Documents</div>
                    {['Aadhar_Card.pdf','Bank_Statement.pdf','Income_Proof.pdf','ITR_2023.pdf'].map(doc => (
                      <div key={doc} className="doc-item">
                        <div className="doc-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div className="doc-name">{doc}</div>
                      </div>
                    ))}
                  </div>
                  {/* Notifications */}
                  <div className="mini-panel">
                    <div className="mini-panel-title">Notifications</div>
                    {[
                      {color:'var(--success)', text:'Loan #LN-2841 disbursed successfully'},
                      {color:'var(--primary)', text:'Credit report ready for Priya S.'},
                      {color:'var(--warning)', text:'Document pending for Sunita V.'},
                    ].map(n => (
                      <div key={n.text} className="notif-item">
                        <div className="notif-dot" style={{background:n.color}}></div>
                        <div className="notif-text">{n.text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animated progress bar at bottom */}
                <div style={{marginTop:'10px', height:'3px', borderRadius:'2px', overflow:'hidden'}}>
                  <div className="bar-sweep" style={{width:'100%'}}></div>
                </div>

              </div>
            </div>

            {/* Floating badge bottom-right */}
            <div className="floating-badge bottom-right">
              <div className="float-icon" style={{background:'var(--primary-light)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <div className="float-label">Avg. Processing Time</div>
                <div className="float-value" style={{color:'var(--primary)'}}>4.2 hrs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUSTED BY ══ */}
      <section id="trusted">
        <div id="trusted-inner">
          <span id="trusted-label">Trusted by leading institutions</span>
          <div id="trusted-logos">
            {['National Banks','NBFCs','Credit Unions','FinTechs','Cooperative Banks','MFIs'].map(label => (
              <div key={label} className="trusted-logo">
                <div className="trusted-logo-icon" style={{background:'var(--bg2)'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                </div>
                <span className="trusted-logo-text">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features">
        <div id="features-inner">
          <div className="section-eyebrow">Platform Capabilities</div>
          <h2 className="section-title">Everything you need to<br/>power modern lending</h2>
          <p className="section-subtitle">A comprehensive suite of AI-driven modules purpose-built for enterprise financial institutions.</p>
          <div id="features-grid">
            {[
              {title:'Application Management', desc:'Streamline intake with smart digital forms, auto-fill, and multi-channel submission — web, mobile, and branch.', active:true},
              {title:'Credit Assessment', desc:'AI-powered risk scoring with bureau integrations, cash flow analysis, and real-time credit decisioning.'},
              {title:'Customer Portal', desc:'Branded self-service portal for applications, status tracking, EMI schedules, and document uploads.'},
              {title:'Workflow Automation', desc:'No-code rule engine to configure approval chains, escalations, and SLA-based routing with full auditability.'},
              {title:'Document Management', desc:'Intelligent OCR-powered document collection, verification, and secure cloud storage with version control.'},
              {title:'Compliance Engine', desc:'Built-in RBI/regulatory rule sets, AML screening, KYC automation, and compliance reporting dashboards.'},
              {title:'Advanced Analytics', desc:'Portfolio-level insights, funnel analytics, cohort analysis, and executive dashboards with real-time data.'},
              {title:'Enterprise Security', desc:'AES-256 encryption, role-based access, JWT auth, OTP login, IP whitelisting, and complete audit trails.'},
            ].map(({title, desc, active}) => (
              <div key={title} className={`feature-card${active?' active-card':''}`}>
                <div className="feature-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ JOURNEY ══ */}
      <section id="journey">
        <div id="journey-inner">
          <div className="section-eyebrow">End-to-End Lending Lifecycle</div>
          <h2 className="section-title" style={{marginBottom:'16px'}}>The Complete Loan Journey</h2>
          <p className="section-subtitle">From first touchpoint to disbursement — every step automated, tracked, and optimized.</p>
          <div id="journey-steps">
            {[
              {num:'01', label:'Application', desc:'Multi-channel digital intake with smart forms'},
              {num:'02', label:'Document Upload', desc:'OCR-powered verification and storage'},
              {num:'03', label:'Credit Assessment', desc:'AI risk scoring & bureau data analysis', active:true},
              {num:'04', label:'Approval', desc:'Automated workflow with escalation rules'},
              {num:'05', label:'Offer Generation', desc:'Dynamic loan offers with rate personalization'},
              {num:'06', label:'Customer Acceptance', desc:'E-sign, OTP-based digital acceptance'},
              {num:'07', label:'Disbursement', desc:'Automated fund transfer with instant alerts'},
            ].map(({num, label, desc, active}) => (
              <div key={num} className="journey-step">
                <div className={`journey-step-num${active?' active':''}`}>{num}</div>
                <div className="journey-step-label">{label}</div>
                <div className="journey-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MODULES ══ */}
      <section id="modules">
        <div id="modules-inner">
          <div className="section-eyebrow">Enterprise Modules</div>
          <h2 className="section-title">Built for every role in<br/>your lending organization</h2>
          <p className="section-subtitle">Dedicated tools for each team member — from front-line officers to risk analysts and compliance officers.</p>
          <div id="modules-grid">
            {[
              {title:'Loan Officer Dashboard', desc:'Complete pipeline management, task prioritization, and borrower communication in one view.', tags:['Pipeline View','Task Manager','Communication'], featured:true},
              {title:'Underwriting Workbench', desc:'Deep-dive analysis tools for credit officers — bureau data, financials, and risk flags side-by-side.', tags:['Credit Analysis','Risk Flags','Bureau Data']},
              {title:'Branch Manager Console', desc:'Monitor team performance, SLA adherence, and branch-level portfolio health in real time.', tags:['Team KPIs','SLA Tracking','Portfolio']},
              {title:'Customer Self-Service', desc:'Empowered borrowers can apply, track, upload documents, and accept offers — anytime, anywhere.', tags:['Apply Online','Track Status','E-Sign']},
            ].map(({title, desc, tags, featured}) => (
              <div key={title} className={`module-card${featured?' featured':''}`}>
                <div className="module-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke={featured?'#fff':'var(--primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="module-title">{title}</div>
                <div className="module-desc">{desc}</div>
                <div className="module-tags">
                  {tags.map(tag => <span key={tag} className="module-tag">{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECURITY & METRICS ══ */}
      <section id="security">
        <div id="security-inner">
          <div id="security-left">
            <div className="section-eyebrow">Bank-Grade Security</div>
            <h2 className="section-title">Security & Compliance at every layer</h2>
            <p className="section-subtitle">Built to meet the highest financial regulatory standards — so your institution can lend with confidence.</p>
            <div id="security-grid">
              {[
                {title:'AES-256 Encryption', desc:'All data encrypted at rest and in transit with military-grade standards.'},
                {title:'Role-Based Access', desc:'Granular permission controls per user role, branch, and product type.'},
                {title:'RBI Compliance', desc:'Built-in rule sets aligned with RBI master directions and SEBI guidelines.'},
                {title:'Complete Audit Trail', desc:'Every action timestamped and logged for regulatory and internal audits.'},
              ].map(({title, desc}) => (
                <div key={title} className="security-item">
                  <div className="security-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="security-item-title">{title}</div>
                  <div className="security-item-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div id="security-right">
            <div id="metrics-grid">
              {[
                {value:'99', unit:'%', label:'Platform Uptime SLA', bar:99, trend:'↑ 0.2% last quarter'},
                {value:'4.2', unit:'h', label:'Avg. Loan Processing Time', bar:60, trend:'↓ 38% from baseline'},
                {value:'87', unit:'%', label:'Auto-Approval Rate', bar:87, trend:'↑ 12% since launch'},
                {value:'300', unit:'+', label:'Enterprise Integrations', bar:75, trend:'20+ added this year'},
              ].map(({value, unit, label, bar, trend}) => (
                <div key={label} className="metric-card">
                  <div className="metric-value">{value}<span className="metric-unit">{unit}</span></div>
                  <div className="metric-label">{label}</div>
                  <div className="metric-bar-wrap">
                    <div className="metric-bar" style={{width:`${bar}%`}}></div>
                  </div>
                  <div className="metric-trend">{trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="testimonials">
        <div id="testimonials-inner">
          <div className="section-eyebrow">Customer Stories</div>
          <h2 className="section-title">Trusted by institutions<br/>across the country</h2>
          <div id="testimonials-grid">
            {[
              {quote:'"Fortress Banking transformed our loan processing from a 7-day manual slog into a 4-hour automated workflow. The AI underwriting alone saved us 60% in operational costs."', name:'Rajiv Menon', role:'CTO, Capital First Bank', initial:'R', featured:false},
              {quote:'"The compliance engine gave us confidence to expand into new lending products. Regulatory checks happen automatically — our compliance team can finally focus on strategy."', name:'Anita Krishnan', role:'Chief Risk Officer, Apex NBFC', initial:'A', featured:true},
              {quote:'"Customer satisfaction scores jumped 40% after we launched the self-service portal. Borrowers love the transparency — they can track every step of their application."', name:'Suresh Iyer', role:'MD, Sahyadri Cooperative Bank', initial:'S', featured:false},
            ].map(({quote, name, role, initial, featured}) => (
              <div key={name} className={`testimonial-card${featured?' featured-t':''}`}>
                <div>
                  <div className="testimonial-stars">{[1,2,3,4,5].map(i=><span key={i} className="star">★</span>)}</div>
                  <p className="testimonial-quote">{quote}</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar" style={{background:featured?'rgba(59,130,246,0.15)':'var(--primary-light)', color:featured?'#60A5FA':'var(--primary)'}}>
                    {initial}
                  </div>
                  <div>
                    <div className="author-name">{name}</div>
                    <div className="author-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq">
        <div id="faq-inner">
          <div className="section-eyebrow">Frequently Asked</div>
          <h2 className="section-title">Questions & Answers</h2>
          <p className="section-subtitle">Everything you need to know about the Fortress Banking platform.</p>
          <div id="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item${openFaq===i?' open':''}`}>
                <div className="faq-question" onClick={() => setOpenFaq(openFaq===i?null:i)}>
                  {faq.question}
                  <span className="faq-question-icon">+</span>
                </div>
                {openFaq===i && <div className="faq-answer">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ══ CTA ══ */}
      <section id="cta-section">
        <div id="cta-inner">
          <div id="cta-left">
            <h2>Ready to modernize<br/>your lending operations?</h2>
            <p>Join hundreds of financial institutions that have digitized their lending workflows with Fortress Banking — and achieved faster decisions, lower costs, and happier customers.</p>
          </div>
          <div id="cta-actions">
            <Link href="/login" className="cta-btn-white">Employee Login</Link>
            <Link href="/customer/login" className="cta-btn-glass">Customer Portal</Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer id="footer">
        <div id="footer-inner">
          <div id="footer-top">
            <div id="footer-brand">
              <div className="brand-logo">
                <div className="logo-icon-f">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <span className="logo-text-f">Fortress Banking</span>
              </div>
              <p>Enterprise Loan Origination Platform built for modern financial institutions. Secure, compliant, and AI-powered.</p>
            </div>
            {[
              {title:'Platform', links:['Loan Origination','Credit Assessment','Customer Portal','Document Management','Analytics']},
              {title:'Solutions', links:['Banks','NBFCs','Credit Unions','FinTechs','MFIs']},
              {title:'Company', links:['About Us','Careers','Blog','Press','Contact']},
              {title:'Legal', links:['Privacy Policy','Terms of Service','Cookie Policy','Compliance','Security']},
            ].map(col => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <div className="footer-links">
                  {col.links.map(link => <span key={link} className="footer-link">{link}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div id="footer-bottom">
            <span id="footer-copy">© 2025 Fortress Banking Technologies Pvt. Ltd. All rights reserved.</span>
            <div id="footer-legal">
              <span className="footer-legal-link">Privacy</span>
              <span className="footer-legal-link">Terms</span>
              <span className="footer-legal-link">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
