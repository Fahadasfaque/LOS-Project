import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Hourglass, Pulse, CheckCircle, Sparkle, SealCheck, Confetti } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { ApplicationDetails } from './shared-types';

interface RoleLoanOfficerProps {
  app: ApplicationDetails;
  formatCurrency: (val: number) => string;
}

export function RoleLoanOfficer({ app, formatCurrency }: RoleLoanOfficerProps) {
  if (app.status === 'DRAFT') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-slate-500/30 transition-colors duration-300">
          <CardHeader className="bg-slate-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0 text-slate-600 border border-slate-500/20">
              <Hourglass className="h-5 w-5" weight="fill" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Draft Preparation
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                Upload required verification documents and submit the application for credit review.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-card">
            <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-[11px] text-muted-foreground font-mono font-medium tracking-wide">Action Required</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
                Use the Documents panel above to upload KYC and income proofs.
                <br />
                Once all required documents are verified by you, use the <strong className="text-primary">Submit Application</strong> button.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'SUBMITTED') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors duration-300">
          <CardHeader className="bg-blue-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600 border border-blue-500/20">
              <Hourglass className="h-5 w-5 animate-pulse" weight="fill" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Awaiting Credit Review
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                Application submitted and pending Credit Analyst review.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-card">
            <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-[11px] text-muted-foreground font-mono font-medium tracking-wide">Next Step Indicator</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">Waiting for Credit Analyst to transition status to <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded ml-1 font-mono text-xs border border-amber-500/20">UNDER_REVIEW</span></p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'UNDER_REVIEW') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-amber-500/30 transition-colors duration-300">
          <CardHeader className="bg-amber-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 border border-amber-500/20">
              <Pulse className="h-5 w-5 animate-pulse" weight="bold" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Credit Underwriting In Progress
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                The application is actively being assessed by the Credit Analysis team.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-4 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground flex-1">System is waiting for underwriting completion.</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">In Progress</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'APPROVED') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors duration-300">
          <CardHeader className="bg-emerald-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" weight="fill" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Loan Approved
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                Approved by underwriting. Awaiting offer generation by the Approver.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-muted/30 border border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center space-y-2">
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Ready for Offer</div>
              <p className="text-xs font-semibold text-muted-foreground">The Approver must configure and generate the final loan offer parameters.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'OFFER_GENERATED' && app.offer) {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors duration-300">
          <CardHeader className="bg-purple-500/5 border-b border-border py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600 border border-purple-500/20">
                <Sparkle className="h-5 w-5 animate-pulse" weight="fill" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Customer Response Required
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                  Record the customer's decision on the generated offer.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Offer Amount</span>
                <span className="font-extrabold text-xl text-slate-900 dark:text-white leading-none">{formatCurrency(app.offer.loanAmount)}</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Monthly EMI</span>
                <span className="font-extrabold text-xl text-purple-600 dark:text-purple-400 leading-none">{formatCurrency(app.offer.emiAmount)}</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Expires</span>
                <span className="font-bold text-base text-slate-900 dark:text-white leading-none mt-0.5">{new Date(app.offer.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3 text-left flex items-start gap-3">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                Customer acceptance or decline is handled through the customer-facing portal. Please contact the applicant to confirm their decision and ensure they sign the e-agreement before expiration.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'OFFER_ACCEPTED') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors duration-300">
          <CardHeader className="bg-emerald-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-500/20">
              <SealCheck className="h-5 w-5" weight="fill" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Offer Accepted
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                Customer has signed the agreement. Awaiting disbursement by the Approver.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'DISBURSED') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-violet-500/30 transition-colors duration-300">
          <CardHeader className="bg-violet-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-600 border border-violet-500/20">
              <Confetti className="h-5 w-5" weight="fill" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Case Closed — Funds Disbursed
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                The loan has been fully processed and funds transferred to the customer.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return null;
}

