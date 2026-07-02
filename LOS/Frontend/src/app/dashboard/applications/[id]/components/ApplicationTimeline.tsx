import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ClockCounterClockwise, User, Lock, Percent, CurrencyInr, PaperPlaneTilt, MagnifyingGlass, SealCheck, XCircle, Confetti, Sparkle, CheckCircle } from '@phosphor-icons/react';

interface ApplicationTimelineProps {
  combinedTimeline: any[];
}

export function ApplicationTimeline({ combinedTimeline }: ApplicationTimelineProps) {
  const getTimelineEventMeta = (type: string, newStatus?: string) => {
    const map: Record<string, { dot: string; border: string; iconBg: string; iconColor: string }> = {
      STATUS_CHANGE_DRAFT:        { dot: 'bg-slate-400 dark:bg-slate-500', border: 'border-l-slate-300 dark:border-l-slate-700', iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-500' },
      STATUS_CHANGE_SUBMITTED:    { dot: 'bg-primary ring-2 ring-primary/25', border: 'border-l-primary/40', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      STATUS_CHANGE_UNDER_REVIEW: { dot: 'bg-amber-500 ring-2 ring-amber-400/25', border: 'border-l-amber-400/50', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
      STATUS_CHANGE_APPROVED:     { dot: 'bg-emerald-500 ring-2 ring-emerald-400/25', border: 'border-l-emerald-400/50', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
      STATUS_CHANGE_OFFER_GENERATED: { dot: 'bg-purple-500 ring-2 ring-purple-400/25', border: 'border-l-purple-400/50', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400' },
      STATUS_CHANGE_OFFER_ACCEPTED:  { dot: 'bg-emerald-500 ring-2 ring-emerald-400/25', border: 'border-l-emerald-400/50', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
      STATUS_CHANGE_REJECTED:     { dot: 'bg-rose-500 ring-2 ring-rose-400/30', border: 'border-l-rose-400/50', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600 dark:text-rose-400' },
      STATUS_CHANGE_DISBURSED:    { dot: 'bg-violet-500 ring-2 ring-violet-400/25', border: 'border-l-violet-400/50', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400' },
      ASSESSMENT:   { dot: 'bg-amber-500 ring-2 ring-amber-400/25', border: 'border-l-amber-400/50', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
      OFFER:        { dot: 'bg-primary ring-2 ring-primary/25', border: 'border-l-primary/40', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      OFFER_ACCEPTED: { dot: 'bg-emerald-500 ring-2 ring-emerald-400/25', border: 'border-l-emerald-400/50', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
      DISBURSEMENT: { dot: 'bg-violet-500 ring-2 ring-violet-400/25', border: 'border-l-violet-400/50', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400' },
    };
    const key = type === 'STATUS_CHANGE' ? `${type}_${newStatus || ''}` : type;
    return map[key] || { dot: 'bg-border', border: 'border-l-border', iconBg: 'bg-muted', iconColor: 'text-muted-foreground' };
  };

  const getTimelineIcon = (type: string, newStatus?: string) => {
    if (type === 'ASSESSMENT') return <Lock className="h-3 w-3" weight="fill" />;
    if (type === 'OFFER' || type === 'OFFER_ACCEPTED') return <Percent className="h-3 w-3" weight="bold" />;
    if (type === 'DISBURSEMENT') return <CurrencyInr className="h-3 w-3" weight="bold" />;
    // STATUS_CHANGE
    if (newStatus === 'SUBMITTED') return <PaperPlaneTilt className="h-3 w-3" weight="bold" />;
    if (newStatus === 'UNDER_REVIEW') return <MagnifyingGlass className="h-3 w-3" weight="bold" />;
    if (newStatus === 'APPROVED') return <SealCheck className="h-3 w-3" weight="fill" />;
    if (newStatus === 'REJECTED') return <XCircle className="h-3 w-3" weight="fill" />;
    if (newStatus === 'DISBURSED') return <Confetti className="h-3 w-3" weight="fill" />;
    if (newStatus === 'OFFER_GENERATED') return <Sparkle className="h-3 w-3" weight="fill" />;
    if (newStatus === 'OFFER_ACCEPTED') return <CheckCircle className="h-3 w-3" weight="fill" />;
    return <ClockCounterClockwise className="h-3 w-3" weight="bold" />;
  };

  return (
    <Card className="border-border bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/10 border-b border-border py-3.5 px-5 flex-row items-center gap-3">
        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <ClockCounterClockwise className="h-3.5 w-3.5 text-primary" weight="bold" />
        </div>
        <div className="text-left">
          <CardTitle className="text-sm font-bold text-foreground leading-none">Lifecycle Timeline</CardTitle>
          <CardDescription className="text-[10px] font-semibold text-muted-foreground mt-0.5">Full compliance audit trail · {combinedTimeline.length} events</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-4 max-h-[440px] overflow-y-auto">
        {combinedTimeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <ClockCounterClockwise className="h-5 w-5 text-muted-foreground/40" weight="bold" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">No timeline events yet.</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical connector line */}
            <div className="absolute left-[13px] top-5 bottom-5 w-px bg-gradient-to-b from-border via-border to-transparent" />

            {combinedTimeline.map((evt, idx) => {
              const meta = getTimelineEventMeta(evt.type, evt.newStatus || (evt.title?.includes('Rejected') ? 'REJECTED' : undefined));
              const isFirst = idx === 0;
              return (
                <div key={evt.id || idx} className={`relative flex gap-3 pb-4 last:pb-0 ${isFirst ? 'pt-0' : ''}`}>
                  {/* Timeline dot with icon */}
                  <div className={`relative z-10 flex items-center justify-center h-7 w-7 rounded-full shrink-0 border border-border/60 ${meta.iconBg} transition-all`}>
                    <span className={`${meta.iconColor}`}>
                      {getTimelineIcon(evt.type, evt.title?.includes('Rejected') ? 'REJECTED' : evt.title?.includes('Approved') ? 'APPROVED' : evt.title?.includes('Submitted') ? 'SUBMITTED' : evt.title?.includes('Review') ? 'UNDER_REVIEW' : evt.title?.includes('Offer Issued') || evt.title?.includes('Generated') ? 'OFFER_GENERATED' : evt.title?.includes('Accepted') ? 'OFFER_ACCEPTED' : evt.title?.includes('Disbursed') || evt.title?.includes('Released') ? 'DISBURSED' : undefined)}
                    </span>
                    {isFirst && <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${meta.dot} border border-card`} />}
                  </div>

                  {/* Event card */}
                  <div className={`flex-1 min-w-0 rounded-xl border border-l-2 bg-card/50 dark:bg-muted/5 hover:bg-muted/20 transition-colors ${meta.border} border-border/60 px-3 py-2.5 text-left`}>
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-foreground leading-tight">{evt.title}</span>
                      <span className="text-[9px] text-muted-foreground font-mono shrink-0 mt-0.5">
                        {new Date(evt.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    {/* Description */}
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{evt.description}</p>
                    {/* Actor */}
                    {evt.changedBy && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                        <div className="h-3.5 w-3.5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <User className="h-2 w-2 text-muted-foreground" />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {evt.changedBy.firstName} {evt.changedBy.lastName}
                          <span className="text-muted-foreground/50 mx-1">·</span>
                          {evt.changedBy.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
