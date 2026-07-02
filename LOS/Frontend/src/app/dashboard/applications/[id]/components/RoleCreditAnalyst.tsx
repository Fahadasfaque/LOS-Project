import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Hourglass, Pulse, MagnifyingGlass, Calculator, ArrowLeft, Lock, WarningCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplicationDetails } from './shared-types';
import { LockedAssessmentCard } from './LockedAssessmentCard';

interface RoleCreditAnalystProps {
  app: ApplicationDetails;
  formatCurrency: (val: number) => string;
  actionLoading: boolean;
  handleStatusTransition: (newStatus: string) => void;
  assessmentStep: number;
  setAssessmentStep: (step: number) => void;
  assessmentNotes: string;
  setAssessmentNotes: (notes: string) => void;
  handleRunAssessment: () => void;
  previewAssessment: any;
  handleSaveAssessment: () => void;
  saveLoading: boolean;
}

export function RoleCreditAnalyst({
  app,
  formatCurrency,
  actionLoading,
  handleStatusTransition,
  assessmentStep,
  setAssessmentStep,
  assessmentNotes,
  setAssessmentNotes,
  handleRunAssessment,
  previewAssessment,
  handleSaveAssessment,
  saveLoading
}: RoleCreditAnalystProps) {
  const [notesError, setNotesError] = useState('');

  const onRunAssessmentClick = () => {
    if (assessmentNotes.trim().length < 50) {
      setNotesError('Please provide at least 50 characters of detailed analysis.');
      return;
    }
    setNotesError('');
    handleRunAssessment();
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssessmentNotes(e.target.value);
    if (e.target.value.trim().length >= 50 && notesError) {
      setNotesError('');
    }
  };

  if (app.status === 'SUBMITTED') {
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-amber-500/30 transition-colors duration-300">
          <CardHeader className="bg-amber-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 border border-amber-500/20">
              <MagnifyingGlass className="h-5 w-5" weight="bold" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Ready for Credit Review
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                Start underwriting assessment for this application.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Applicant</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">{app.applicantName}</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Loan Amount</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(app.loanAmount)}</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Monthly Income</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(app.monthlyIncome)}</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Documents</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{app.documents.length} Uploaded</span>
              </div>
            </div>
            <Button onClick={() => handleStatusTransition('UNDER_REVIEW')} disabled={actionLoading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-11 rounded-lg cursor-pointer text-sm gap-2 transition-all shadow-sm">
              <MagnifyingGlass className="h-4.5 w-4.5" weight="bold" />
              {actionLoading ? 'Starting Review...' : 'Begin Credit Assessment'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (app.status === 'UNDER_REVIEW') {
    if (app.assessment?.status === 'COMPLETED') {
      return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          <LockedAssessmentCard app={app} />
          <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Hourglass className="h-4 w-4 animate-pulse" weight="fill" />
                Awaiting Approver Decision
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-border py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 border border-amber-500/20">
                <Pulse className="h-5 w-5 animate-pulse" weight="bold" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Underwriting Assessment
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                  Step {assessmentStep + 1} of 2 — {assessmentStep === 0 ? 'Enter decision notes' : 'Review & lock assessment'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {assessmentStep === 0 ? (
                <motion.div key="step0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  {/* Snapshot Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 flex justify-between items-center shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Income</span>
                      <span className="font-extrabold text-lg text-slate-900 dark:text-white">{formatCurrency(app.monthlyIncome)}</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 flex justify-between items-center shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">LTI Ratio</span>
                      <span className={`font-extrabold text-lg ${app.loanAmount / (app.monthlyIncome * 12) > 0.5 ? 'text-rose-600' : app.loanAmount / (app.monthlyIncome * 12) > 0.3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {((app.loanAmount / (app.monthlyIncome * 12)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes" className="text-xs font-bold text-slate-900 dark:text-white">Decision Analysis Notes <span className="text-rose-500">*</span></Label>
                      <span className={`text-[10px] font-mono ${assessmentNotes.length < 50 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {assessmentNotes.length} / 50 min chars
                      </span>
                    </div>
                    <textarea id="notes" rows={5}
                      placeholder="Enter detailed analytical findings, risk arguments, income verification notes, and credit history observations..."
                      value={assessmentNotes} onChange={handleNotesChange}
                      className={`w-full p-4 rounded-xl border ${notesError ? 'border-rose-500 focus:ring-rose-500' : 'border-border focus:ring-amber-500'} bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 resize-y font-medium shadow-sm transition-shadow`} />
                    {notesError && (
                      <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold mt-1">
                        <WarningCircle className="h-4 w-4" weight="fill" />
                        {notesError}
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={onRunAssessmentClick}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 rounded-xl cursor-pointer text-sm gap-2 flex items-center justify-center transition-all shadow-md">
                    <Calculator className="h-4.5 w-4.5" />
                    Run Credit Scoring Engine
                  </Button>
                </motion.div>
              ) : (
                previewAssessment && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Credit Score</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-3xl leading-none">{previewAssessment.creditScore} <span className="text-sm text-muted-foreground">/ 900</span></span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${previewAssessment.riskLevel === 'LOW' ? 'bg-emerald-500' : previewAssessment.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min((previewAssessment.creditScore / 900) * 100, 100)}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-left flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Risk Level</span>
                        <span className={`font-extrabold text-lg uppercase ${previewAssessment.riskLevel === 'LOW' ? 'text-emerald-600' : previewAssessment.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-rose-600'}`}>
                          {previewAssessment.riskLevel}
                        </span>
                      </div>
                      <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-left flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Recommendation</span>
                        <span className="font-extrabold text-lg text-slate-900 dark:text-white">{previewAssessment.recommendation}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setAssessmentStep(0)} disabled={saveLoading}
                        className="flex-1 border-border bg-card text-foreground hover:bg-muted font-bold h-11 rounded-xl cursor-pointer text-sm shadow-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                      </Button>
                      <Button onClick={handleSaveAssessment} disabled={saveLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl cursor-pointer text-sm gap-2 shadow-md">
                        <Lock className="h-4 w-4" weight="fill" />
                        {saveLoading ? 'Locking Report...' : 'Confirm & Lock'}
                      </Button>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (['APPROVED', 'OFFER_GENERATED', 'OFFER_ACCEPTED', 'DISBURSED', 'REJECTED'].includes(app.status)) {
    return (
      <div className="space-y-6">
        {app.assessment?.status === 'COMPLETED' && <LockedAssessmentCard app={app} />}
      </div>
    );
  }

  return null;
}
