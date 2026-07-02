import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, MagnifyingGlass } from '@phosphor-icons/react';
import { ApplicationDetails } from './shared-types';

interface LockedAssessmentCardProps {
  app: ApplicationDetails;
}

export function LockedAssessmentCard({ app }: LockedAssessmentCardProps) {
  if (!app.assessment || app.assessment.status !== 'COMPLETED') return null;
  
  const { creditScore, riskLevel, recommendation, assessmentNotes: notes, assessedBy } = app.assessment;
  const riskColor = riskLevel === 'LOW' ? 'text-emerald-600 dark:text-emerald-400' : riskLevel === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  const scoreBar = Math.min((creditScore / 900) * 100, 100);

  return (
    <Card className="border-border bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 py-3.5 px-5">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Lock className="h-4 w-4" weight="fill" />
          Locked Credit Report
        </CardTitle>
        <CardDescription className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-0.5">
          Underwriter decision locked on {new Date(app.assessment.assessedAt).toLocaleDateString('en-IN')}.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4 text-xs">
        {/* Credit Score Bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Credit Score</span>
            <span className="font-extrabold text-foreground text-sm">{creditScore} <span className="text-muted-foreground font-normal text-xs">/ 900</span></span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${riskLevel === 'LOW' ? 'bg-emerald-500' : riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${scoreBar}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/10 border border-border p-2.5 rounded-lg text-left">
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Risk Level</span>
            <p className={`font-extrabold mt-1 text-sm uppercase ${riskColor}`}>{riskLevel}</p>
          </div>
          <div className="bg-muted/10 border border-border p-2.5 rounded-lg text-left">
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Recommendation</span>
            <p className="font-bold mt-1 text-foreground text-xs">{recommendation}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Decision Notes</span>
          <div className="p-3 bg-muted/20 border border-border rounded-lg italic text-foreground/80 font-medium leading-relaxed text-xs">
            &ldquo;{notes}&rdquo;
          </div>
        </div>

        {assessedBy && (
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <div className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <MagnifyingGlass className="h-2.5 w-2.5 text-amber-600" weight="bold" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Assessed by {assessedBy.firstName} {assessedBy.lastName} · {assessedBy.role}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
