import React from 'react';
import { Button } from '@/components/ui/button';
import { ApplicationDetails } from './shared-types';
import { ArrowLeft, Bank, Clock, User, PaperPlaneTilt, MagnifyingGlass, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface ApplicationHeaderProps {
  app: ApplicationDetails;
  roleConf: any;
  isOfficer: boolean;
  isAnalyst: boolean;
  isApprover: boolean;
  actionLoading: boolean;
  handleStatusTransition: (newStatus: string) => void;
  formatCurrency: (val: number) => string;
  assignee: { name: string; role: string };
  lastUpdate: { timeStr: string; by: string };
  stageDate: string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function ApplicationHeader({
  app,
  roleConf,
  isOfficer,
  isAnalyst,
  isApprover,
  actionLoading,
  handleStatusTransition,
  formatCurrency,
  assignee,
  lastUpdate,
  stageDate,
  getStatusBadge,
}: ApplicationHeaderProps) {
  const router = useRouter();

  const getStageAccentColor = () => {
    if (app.status === 'REJECTED') return 'bg-rose-500';
    if (app.status === 'DRAFT') return 'bg-slate-400';
    if (app.status === 'SUBMITTED') return 'bg-blue-500';
    if (app.status === 'UNDER_REVIEW') return 'bg-amber-500';
    if (['APPROVED', 'OFFER_ACCEPTED'].includes(app.status)) return 'bg-emerald-500';
    if (app.status === 'OFFER_GENERATED') return 'bg-purple-500';
    if (app.status === 'DISBURSED') return 'bg-violet-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Breadcrumbs Row */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left">
        <span>Dashboard</span>
        <span className="text-muted-foreground/45">/</span>
        <span>Applications</span>
        <span className="text-muted-foreground/45">/</span>
        <span className="text-primary font-extrabold">{app.applicationNumber}</span>
      </div>

      {/* Header Content Wrapper */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5 bg-card border border-border rounded-xl p-5 shadow-sm text-left">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <Button size="sm" variant="outline" onClick={() => router.back()}
            className="mt-1 h-8 w-8 p-0 shrink-0 border-border bg-card hover:bg-muted cursor-pointer rounded-lg shadow-sm">
            <ArrowLeft className="h-4 w-4 text-foreground" weight="bold" />
          </Button>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-primary font-extrabold tracking-wider">{app.applicationNumber}</span>
              {getStatusBadge(app.status)}
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border font-mono ${roleConf.badgeBg} ${roleConf.badgeText} ${roleConf.badgeBorder}`}>
                {roleConf.icon}
                {roleConf.label}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight capitalize leading-tight truncate">{app.applicantName}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1"><Bank className="h-3.5 w-3.5" />{app.loanType} Loan</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-foreground font-bold">{formatCurrency(app.loanAmount)}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="font-mono">{new Date(app.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Header Quick Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Current Stage */}
          <div className="bg-muted/10 border border-border/80 rounded-xl p-3.5 text-left flex items-start gap-3 min-w-[155px]">
            <div className="mt-1 h-5 w-5 rounded-lg border border-border flex items-center justify-center bg-card shrink-0">
              <span className={`h-2 w-2 rounded-full ${getStageAccentColor()}`} />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Current Stage</span>
              <span className="text-xs font-extrabold text-foreground block capitalize mt-0.5">{app.status.replace(/_/g, ' ').toLowerCase()}</span>
              <span className="text-[9px] font-semibold text-muted-foreground block mt-0.5">Since {stageDate}</span>
            </div>
          </div>

          {/* Card 2: Assigned To */}
          <div className="bg-muted/10 border border-border/80 rounded-xl p-3.5 text-left flex items-start gap-3 min-w-[155px]">
            <div className="mt-1 h-5 w-5 rounded-lg border border-border flex items-center justify-center bg-card shrink-0">
              <User className="h-3 w-3 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Assigned To</span>
              <span className="text-xs font-extrabold text-foreground block capitalize mt-0.5 truncate max-w-[110px]">{assignee.name}</span>
              <span className="text-[9px] font-semibold text-muted-foreground block mt-0.5">{assignee.role}</span>
            </div>
          </div>

          {/* Card 3: Last Updated */}
          <div className="bg-muted/10 border border-border/80 rounded-xl p-3.5 text-left flex items-start gap-3 min-w-[155px]">
            <div className="mt-1 h-5 w-5 rounded-lg border border-border flex items-center justify-center bg-card shrink-0">
              <Clock className="h-3 w-3 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Last Updated</span>
              <span className="text-xs font-extrabold text-foreground block mt-0.5">{lastUpdate.timeStr.split(',')[0]}</span>
              <span className="text-[9px] font-semibold text-muted-foreground block mt-0.5">by {lastUpdate.by}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global CTA Action Panel (if any buttons are visible) */}
      {((app.status === 'DRAFT' && isOfficer) || 
        (app.status === 'SUBMITTED' && isAnalyst) || 
        (app.status === 'UNDER_REVIEW' && isApprover)) && (
        <div className="flex justify-end p-3 bg-muted/10 border border-border rounded-xl shadow-sm gap-2">
          {app.status === 'DRAFT' && isOfficer && (
            <Button onClick={() => handleStatusTransition('SUBMITTED')} disabled={actionLoading}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold cursor-pointer shadow h-9 px-4 rounded-lg text-xs gap-1.5">
              <PaperPlaneTilt className="h-4 w-4" weight="bold" />
              {actionLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}

          {app.status === 'SUBMITTED' && isAnalyst && (
            <Button onClick={() => handleStatusTransition('UNDER_REVIEW')} disabled={actionLoading}
              className="bg-amber-650 hover:bg-amber-600 text-white font-semibold cursor-pointer shadow h-9 px-4 rounded-lg text-xs gap-1.5">
              <MagnifyingGlass className="h-4 w-4" weight="bold" />
              {actionLoading ? 'Starting...' : 'Start Credit Review'}
            </Button>
          )}

          {app.status === 'UNDER_REVIEW' && isApprover && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusTransition('APPROVED')} disabled={actionLoading || !app.assessment || app.assessment.status !== 'COMPLETED'}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow h-9 px-4 rounded-lg text-xs gap-1.5"
                title={(!app.assessment || app.assessment.status !== 'COMPLETED') ? 'Credit assessment must be locked first.' : ''}>
                <CheckCircle className="h-4 w-4" weight="bold" />
                Approve Application
              </Button>
              <Button onClick={() => handleStatusTransition('REJECTED')} disabled={actionLoading} variant="destructive"
                className="font-semibold cursor-pointer shadow h-9 px-4 rounded-lg text-xs gap-1.5">
                <XCircle className="h-4 w-4" weight="bold" />
                Reject Application
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
