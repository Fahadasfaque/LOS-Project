'use client';

import React from 'react';
import { useAI } from './AIProvider';

interface CapabilityCard {
  title: string;
  desc: string;
  prompt: string;
  iconSvg: React.ReactNode;
  iconClass: string;
}

const CARDS: CapabilityCard[] = [
  {
    title: 'Home Loan',
    desc: 'Check eligibility thresholds & required files',
    prompt: 'What are the home loan eligibility criteria and DTI thresholds?',
    iconClass: 'bg-blue-600/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    iconSvg: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    title: 'Personal Loan',
    desc: 'Review unsecured markups & requirements',
    prompt: 'Tell me about personal loan interest rates and requirements',
    iconClass: 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    iconSvg: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    title: 'Business Loan',
    desc: 'Explore commercial finance & turnover ratios',
    prompt: 'What are the commercial/business loan criteria?',
    iconClass: 'bg-teal-600/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
    iconSvg: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
  {
    title: 'Education Finance',
    desc: 'Check flexible student payback schedules',
    prompt: 'What are the options for student or education financing?',
    iconClass: 'bg-violet-600/10 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    iconSvg: (
      <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
      </svg>
    ),
  },
];

export function AIQuickActions({ compact = false }: { compact?: boolean }) {
  const { sendMessage } = useAI();

  const displayCards = compact ? CARDS.slice(0, 4) : CARDS;

  return (
    <div className={`grid gap-2.5 w-full max-w-full box-border overflow-hidden text-slate-800 dark:text-slate-200 ${compact ? 'grid-cols-2 px-0 pb-5 pt-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-0 pb-6 pt-1'}`}>
      {displayCards.map(c => {
        return (
          <button
            key={c.title}
            onClick={() => sendMessage(c.prompt)}
            className="
              group flex flex-col text-left p-3.5 rounded-lg border bg-white dark:bg-slate-900/60
              border-slate-200 dark:border-slate-850 shadow-sm
              hover:border-blue-400 dark:hover:border-blue-800
              hover:shadow-md hover:-translate-y-0.5
              transition-all duration-200 cursor-pointer relative min-h-[120px] overflow-hidden
              font-sans
            "
          >
            {/* Top gradient highlight on hover */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Icon top-left */}
            <div className={`shrink-0 p-2 rounded-[9px] w-[34px] h-[34px] flex items-center justify-center ${c.iconClass} transition-colors duration-200`}>
              {c.iconSvg}
            </div>

            {/* Title below icon */}
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-3">
              {c.title}
            </h4>

            {/* Description below title */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 pr-4 font-medium">
              {c.desc}
            </p>

            {/* Arrow bottom-right */}
            <div className="absolute bottom-3 right-3">
              <svg
                className="w-3.5 h-3.5 text-slate-400 dark:text-slate-650 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
