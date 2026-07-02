import re

with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add Imports
code = code.replace(
    "import { useState, useEffect, useRef } from 'react';",
    "import { useState, useEffect, useRef } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';\nimport gsap from 'gsap';\nimport { useGSAP } from '@gsap/react';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\n\nif (typeof window !== 'undefined') {\n  gsap.registerPlugin(ScrollTrigger);\n}"
)

# 2. Add Hooks in LandingPage
hooks_to_add = """
  /* Journey Active Step */
  const [journeyHover, setJourneyHover] = useState(false);
  const [journeyStep, setJourneyStep] = useState(2);
  useEffect(() => {
    if (journeyHover) return;
    const id = setInterval(() => setJourneyStep(s => (s + 1) % 7), 3000);
    return () => clearInterval(id);
  }, [journeyHover]);

  /* Modules Carousel */
  const [moduleHover, setModuleHover] = useState(false);
  const [moduleIndex, setModuleIndex] = useState(0);
  useEffect(() => {
    if (moduleHover) return;
    const id = setInterval(() => setModuleIndex(s => (s + 1) % 4), 4500);
    return () => clearInterval(id);
  }, [moduleHover]);

  /* Features Hover */
  const [featureHovered, setFeatureHovered] = useState<number | null>(null);

  /* Testimonials Hover */
  const [testimonialHovered, setTestimonialHovered] = useState<number | null>(null);

  useGSAP(() => {
    /* Features GSAP Scroll Reveal */
    gsap.from('.feature-card-gsap', {
      scrollTrigger: { trigger: '#features-grid', start: 'top 80%' },
      y: 30, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out'
    });

    /* Journey GSAP Scroll Reveal */
    const tlJourney = gsap.timeline({ scrollTrigger: { trigger: '#journey-steps', start: 'top 75%' } });
    tlJourney.from('.journey-connector-line', { scaleX: 0, transformOrigin: 'left center', duration: 1, ease: 'none' })
             .from('.journey-step-gsap', { scale: 0, stagger: 0.15, duration: 0.5, ease: 'back.out(1.7)' }, "-=0.8")
             .from('.journey-step-text-gsap', { y: -10, opacity: 0, stagger: 0.15, duration: 0.4 }, "-=0.8");

    /* Security Metrics GSAP */
    gsap.from('.metric-value-gsap', {
      scrollTrigger: { trigger: '#metrics-grid', start: 'top 85%' },
      textContent: 0,
      duration: 2,
      ease: 'power4.out',
      snap: { textContent: 1 },
      stagger: 0.2
    });

    /* Security Cards GSAP */
    gsap.from('.security-item-gsap', {
      scrollTrigger: { trigger: '#security-grid', start: 'top 85%' },
      x: -20, opacity: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out'
    });

    /* Testimonials Reveal GSAP */
    gsap.from('.testimonial-card-gsap', {
      scrollTrigger: { trigger: '#testimonials-grid', start: 'top 85%' },
      y: 40, opacity: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out'
    });

    /* Trusted By Scroll Acceleration */
    let setter = gsap.quickSetter(".animate-marquee", "animationDuration", "s");
    let clamp = gsap.utils.clamp(8, 20);
    ScrollTrigger.create({
      onUpdate: (self) => {
        let velocity = Math.abs(self.getVelocity());
        let duration = clamp(20 - (velocity / 100));
        setter(duration);
      }
    });
  });
"""
code = code.replace(
    "  const [dashVisible, setDashVisible] = useState(false);",
    hooks_to_add + "\n  const [dashVisible, setDashVisible] = useState(false);"
)

# 3. Add CSS
css_to_add = """
        /* ─── NEW ANIMATIONS ─── */
        /* Features */
        .feature-card::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          height: 3px; width: 0%; background: linear-gradient(90deg, var(--primary), #60A5FA);
          transition: width 0.4s ease-out; opacity: 1 !important;
        }
        .feature-card.active-card::before, .feature-card:hover::before { width: 100%; }
        
        .feature-card {
           position: relative;
        }

        @keyframes borderSweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .feature-card::after {
           content: ''; position: absolute; inset: 0; border-radius: var(--radius-lg);
           padding: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
           background-size: 200% 100%;
           -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
           -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
           animation: borderSweep 4s linear infinite; opacity: 0.4;
        }

        @keyframes iconPulse {
          0%, 100% { stroke-width: 2; filter: drop-shadow(0 0 0 transparent); }
          50% { stroke-width: 2.5; filter: drop-shadow(0 0 4px var(--primary)); }
        }
        .feature-icon-wrap svg { animation: iconPulse 4s infinite; }

        /* Journey */
        @keyframes lineFlow { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        .animated-connector { stroke-dasharray: 20, 10; animation: lineFlow 4s linear infinite; }
        
        @keyframes radarPulse { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 100% { box-shadow: 0 0 0 20px rgba(59,130,246,0); } }
        .journey-step-num.active { animation: radarPulse 2s infinite; }

        /* Modules */
        .module-tags .module-tag { position: relative; overflow: hidden; transition: transform 0.2s; }
        .module-tags .module-tag:hover { transform: translate(2px, -2px); }
        @keyframes tagShimmer { 0% { left: -100%; } 100% { left: 200%; } }
        .module-card.featured .module-tag::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: tagShimmer 3s infinite;
        }

        /* Security */
        @keyframes shieldRadar { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 100% { box-shadow: 0 0 0 15px rgba(59,130,246,0); } }
        .security-item-icon { position: relative; border-radius: 50%; }
        .security-item-icon::before { content:''; position:absolute; inset:0; border-radius:50%; animation: shieldRadar 3s infinite; }

        @keyframes borderPass { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .security-item::after {
           content: ''; position: absolute; inset: 0; border-radius: var(--radius-md);
           padding: 1px; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent);
           background-size: 200% 100%;
           -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
           -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
           animation: borderPass 5s linear infinite; opacity: 0.5;
        }
        .security-item { position: relative; }
        .security-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .security-item:hover .security-item-icon { transform: scale(1.15); background: var(--primary); }
        .security-item:hover .security-item-icon svg { color: white; fill: white; }

        .metric-card { transition: transform 0.2s, box-shadow 0.2s; }
        .metric-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }

        /* Trusted By */
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: max-content; animation: marquee 20s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .mask-edges { mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }
        .trusted-logo:hover { transform: scale(1.03); }
        .trusted-logo:hover .trusted-logo-text { color: var(--primary); }
        
        /* Testimonials Carousel */
        @keyframes tmarquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-tmarquee { display: flex; gap: 24px; width: max-content; animation: tmarquee 40s linear infinite; }
        .animate-tmarquee:hover { animation-play-state: paused; }
"""
code = code.replace(
    "/* ─── THEME TOGGLE ─── */",
    css_to_add + "\n        /* ─── THEME TOGGLE ─── */"
)

# 4. Modifying Features Grid
features_grid_old = """          <div id="features-grid">
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
          </div>"""
features_grid_new = """          <div id="features-grid">
            {[
              {title:'Application Management', desc:'Streamline intake with smart digital forms, auto-fill, and multi-channel submission — web, mobile, and branch.', active:true},
              {title:'Credit Assessment', desc:'AI-powered risk scoring with bureau integrations, cash flow analysis, and real-time credit decisioning.'},
              {title:'Customer Portal', desc:'Branded self-service portal for applications, status tracking, EMI schedules, and document uploads.'},
              {title:'Workflow Automation', desc:'No-code rule engine to configure approval chains, escalations, and SLA-based routing with full auditability.'},
              {title:'Document Management', desc:'Intelligent OCR-powered document collection, verification, and secure cloud storage with version control.'},
              {title:'Compliance Engine', desc:'Built-in RBI/regulatory rule sets, AML screening, KYC automation, and compliance reporting dashboards.'},
              {title:'Advanced Analytics', desc:'Portfolio-level insights, funnel analytics, cohort analysis, and executive dashboards with real-time data.'},
              {title:'Enterprise Security', desc:'AES-256 encryption, role-based access, JWT auth, OTP login, IP whitelisting, and complete audit trails.'},
            ].map(({title, desc, active}, i) => {
              const isHovered = featureHovered === i;
              const isOtherHovered = featureHovered !== null && !isHovered;
              return (
              <motion.div
                key={title}
                className={`feature-card feature-card-gsap ${active ? ' active-card' : ''}`}
                onMouseEnter={() => setFeatureHovered(i)}
                onMouseLeave={() => setFeatureHovered(null)}
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.04)" }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                style={{ opacity: isOtherHovered ? 0.7 : 1 }}
              >
                <div className="feature-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </motion.div>
            )})}
          </div>"""
code = code.replace(features_grid_old, features_grid_new)

# 5. Modifying Journey steps
journey_old = """          <div id="journey-steps">
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
          </div>"""
journey_new = """          <div id="journey-steps" onMouseEnter={() => setJourneyHover(true)} onMouseLeave={() => setJourneyHover(false)}>
            <svg className="journey-connector-line" style={{position: 'absolute', top: 32, left: '5%', width: '90%', height: 2, zIndex: 0}}>
               <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--primary)" strokeWidth="2" className="animated-connector" />
            </svg>
            {[
              {num:'01', label:'Application', desc:'Multi-channel digital intake with smart forms'},
              {num:'02', label:'Document Upload', desc:'OCR-powered verification and storage'},
              {num:'03', label:'Credit Assessment', desc:'AI risk scoring & bureau data analysis'},
              {num:'04', label:'Approval', desc:'Automated workflow with escalation rules'},
              {num:'05', label:'Offer Generation', desc:'Dynamic loan offers with rate personalization'},
              {num:'06', label:'Customer Acceptance', desc:'E-sign, OTP-based digital acceptance'},
              {num:'07', label:'Disbursement', desc:'Automated fund transfer with instant alerts'},
            ].map(({num, label, desc}, i) => {
              const active = i === journeyStep;
              return (
              <div key={num} className="journey-step">
                <motion.div 
                  className={`journey-step-num journey-step-gsap ${active?' active':''}`}
                  whileHover={{ scale: 1.15, boxShadow: "0 0 0 6px rgba(59,130,246,0.25), 0 4px 20px rgba(59,130,246,0.4)" }}
                >
                  {num}
                </motion.div>
                <div className="journey-step-label journey-step-text-gsap" style={{ color: active ? '#fff' : '#F1F5F9' }}>{label}</div>
                <div className="journey-step-desc journey-step-text-gsap">{desc}</div>
              </div>
            )})}
          </div>"""
code = code.replace(journey_old, journey_new)
code = code.replace(
    "#journey-steps::before {\n          content: ''; position: absolute; top: 32px; left: 5%; right: 5%;\n          height: 2px; background: linear-gradient(90deg, var(--primary), #60A5FA, var(--primary)); z-index: 0;\n        }",
    "/* journey-steps::before removed for GSAP */"
)

# 6. Modifying Modules Grid
modules_old = """          <div id="modules-grid">
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
          </div>"""
modules_new = """          <div id="modules-grid" onMouseEnter={() => setModuleHover(true)} onMouseLeave={() => setModuleHover(false)}>
            {[
              {title:'Loan Officer Dashboard', desc:'Complete pipeline management, task prioritization, and borrower communication in one view.', tags:['Pipeline View','Task Manager','Communication']},
              {title:'Underwriting Workbench', desc:'Deep-dive analysis tools for credit officers — bureau data, financials, and risk flags side-by-side.', tags:['Credit Analysis','Risk Flags','Bureau Data']},
              {title:'Branch Manager Console', desc:'Monitor team performance, SLA adherence, and branch-level portfolio health in real time.', tags:['Team KPIs','SLA Tracking','Portfolio']},
              {title:'Customer Self-Service', desc:'Empowered borrowers can apply, track, upload documents, and accept offers — anytime, anywhere.', tags:['Apply Online','Track Status','E-Sign']},
            ].map(({title, desc, tags}, i) => {
              const active = moduleIndex === i;
              const isOtherActive = moduleIndex !== i;
              return (
              <div key={title} className={`module-card${active?' featured':''}`} style={{ position: 'relative', zIndex: 1, opacity: moduleHover && isOtherActive ? 0.6 : 1 }} onMouseEnter={() => setModuleIndex(i)}>
                {active && (
                  <motion.div
                    layoutId="activeModuleBg"
                    className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                    style={{ background: 'var(--primary)', borderRadius: 'var(--radius-lg)' }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                )}
                <motion.div className="module-icon-wrap" animate={{ scale: active ? 1.1 : 1 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={active?'#fff':'var(--primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </motion.div>
                <div className="module-title" style={{ color: active ? '#fff' : 'var(--navy)' }}>{title}</div>
                <div className="module-desc" style={{ color: active ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)' }}>{desc}</div>
                <div className="module-tags">
                  {tags.map(tag => <span key={tag} className="module-tag">{tag}</span>)}
                </div>
              </div>
            )})}
          </div>"""
code = code.replace(modules_old, modules_new)

# 7. Modifying Security & Metrics
code = code.replace(
    'className="security-item"',
    'className="security-item security-item-gsap"'
)
code = code.replace(
    '<div className="metric-value">{value}',
    '<div className="metric-value"><span className="metric-value-gsap">{value}</span>'
)

# 8. Modifying Customer Stories
testimonials_old = """          <div id="testimonials-grid">
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
          </div>"""
testimonials_new = """          <div id="testimonials-grid" style={{ overflow: 'hidden' }}>
            <div className="animate-tmarquee" style={{ gap: '24px' }}>
              {[
                {quote:'"Fortress Banking transformed our loan processing from a 7-day manual slog into a 4-hour automated workflow. The AI underwriting alone saved us 60% in operational costs."', name:'Rajiv Menon', role:'CTO, Capital First Bank', initial:'R'},
                {quote:'"The compliance engine gave us confidence to expand into new lending products. Regulatory checks happen automatically — our compliance team can finally focus on strategy."', name:'Anita Krishnan', role:'Chief Risk Officer, Apex NBFC', initial:'A'},
                {quote:'"Customer satisfaction scores jumped 40% after we launched the self-service portal. Borrowers love the transparency — they can track every step of their application."', name:'Suresh Iyer', role:'MD, Sahyadri Cooperative Bank', initial:'S'},
                {quote:'"Fortress Banking transformed our loan processing from a 7-day manual slog into a 4-hour automated workflow. The AI underwriting alone saved us 60% in operational costs."', name:'Rajiv Menon (Clone)', role:'CTO, Capital First Bank', initial:'R'},
                {quote:'"The compliance engine gave us confidence to expand into new lending products. Regulatory checks happen automatically — our compliance team can finally focus on strategy."', name:'Anita Krishnan (Clone)', role:'Chief Risk Officer, Apex NBFC', initial:'A'},
                {quote:'"Customer satisfaction scores jumped 40% after we launched the self-service portal. Borrowers love the transparency — they can track every step of their application."', name:'Suresh Iyer (Clone)', role:'MD, Sahyadri Cooperative Bank', initial:'S'},
              ].map(({quote, name, role, initial}, i) => {
                const isActive = testimonialHovered !== null ? testimonialHovered === i : i === 1 || i === 4;
                const isHovered = testimonialHovered !== null;
                return (
                <motion.div 
                  key={name+i} 
                  className={`testimonial-card testimonial-card-gsap${isActive?' featured-t':''}`}
                  style={{ width: '400px', flexShrink: 0, zIndex: 1, scale: isHovered && !isActive ? 0.98 : 1 }}
                  onMouseEnter={() => setTestimonialHovered(i)}
                  onMouseLeave={() => setTestimonialHovered(null)}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTestimonialBg" 
                      className="absolute inset-0 bg-[#0B132B] rounded-2xl -z-10"
                      style={{ background: '#0B132B', borderRadius: 'var(--radius-lg)' }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  )}
                  <div>
                    <div className="testimonial-stars">{[1,2,3,4,5].map(j=><span key={j} className="star">★</span>)}</div>
                    <p className="testimonial-quote" style={{ color: isActive ? '#64748B' : undefined }}>{quote}</p>
                  </div>
                  <div className="testimonial-author">
                    <motion.div className="author-avatar" style={{background:isActive?'rgba(59,130,246,0.15)':'var(--primary-light)', color:isActive?'#60A5FA':'var(--primary)'}} animate={{ scale: isActive ? 1.1 : 1 }}>
                      {initial}
                    </motion.div>
                    <div>
                      <div className="author-name" style={{ color: isActive ? '#F1F5F9' : undefined }}>{name}</div>
                      <div className="author-role" style={{ color: isActive ? '#475569' : undefined }}>{role}</div>
                    </div>
                  </div>
                </motion.div>
              )})}
            </div>
          </div>"""
code = code.replace(testimonials_old, testimonials_new)

# 9. Modifying Trusted By
trusted_old = """          <div id="trusted-logos">
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
          </div>"""
trusted_new = """          <div id="trusted-logos" className="mask-edges" style={{ overflow: 'hidden' }}>
            <div className="animate-marquee" style={{ gap: '48px', paddingRight: '48px' }}>
              {[...['National Banks','NBFCs','Credit Unions','FinTechs','Cooperative Banks','MFIs'], ...['National Banks','NBFCs','Credit Unions','FinTechs','Cooperative Banks','MFIs']].map((label, i) => (
                <div key={label+i} className="trusted-logo">
                  <div className="trusted-logo-icon" style={{background:'var(--bg2)'}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <span className="trusted-logo-text">{label}</span>
                </div>
              ))}
            </div>
          </div>"""
code = code.replace(trusted_old, trusted_new)

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Changes applied to src/app/page.tsx")
