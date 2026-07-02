import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Percent, ArrowRight, ArrowLeft, PaperPlaneTilt, WarningCircle, Calculator } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplicationDetails } from './shared-types';
import { LockedAssessmentCard } from './LockedAssessmentCard';
import { toast } from 'sonner';

interface RoleApproverProps {
  app: ApplicationDetails;
  formatCurrency: (val: number) => string;
  offerStep: number;
  setOfferStep: (step: number) => void;
  handleGenerateOffer: (e: React.FormEvent) => void;
  interestRate: number;
  setInterestRate: (rate: number) => void;
  tenureMonths: number;
  setTenureMonths: (months: number) => void;
  calculatedEmi: number;
  calculatedTotalRepayment: number;
  offerLoading: boolean;
}

export function RoleApprover({
  app,
  formatCurrency,
  offerStep,
  setOfferStep,
  handleGenerateOffer,
  interestRate,
  setInterestRate,
  tenureMonths,
  setTenureMonths,
  calculatedEmi,
  calculatedTotalRepayment,
  offerLoading,
}: RoleApproverProps) {
  const [validationError, setValidationError] = useState('');

  const handleNextStep = () => {
    if (interestRate < 1 || interestRate > 50) {
      setValidationError('Interest rate must be between 1% and 50%.');
      return;
    }
    if (tenureMonths < 1 || tenureMonths > 360) {
      setValidationError('Tenure must be between 1 and 360 months.');
      return;
    }
    setValidationError('');
    setOfferStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Show locked assessment if available */}
      {app.assessment && <LockedAssessmentCard app={app} />}

      {/* Offer generator — APPROVED status, no offer yet */}
      {app.status === 'APPROVED' && !app.offer && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors duration-300">
            <CardHeader className="bg-emerald-500/5 border-b border-border py-4 px-6 flex flex-row items-center gap-4 space-y-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-500/20">
                <Calculator className="h-5 w-5" weight="bold" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Loan Offer
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-muted-foreground leading-normal">
                  Step {offerStep + 1} of 2 — {offerStep === 0 ? 'Define loan terms' : 'Preview EMI & generate offer'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGenerateOffer}>
                <AnimatePresence mode="wait">
                  {offerStep === 0 ? (
                    <motion.div key="offer0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6 text-left">
                        <div className="space-y-2">
                          <Label htmlFor="interestRate" className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            Interest Rate <span className="text-muted-foreground font-medium text-[10px] bg-muted px-2 py-0.5 rounded-full">% p.a.</span>
                          </Label>
                          <div className="relative">
                            <Input id="interestRate" type="number" step="0.01" min="1" max="50"
                              value={interestRate} onChange={(e) => {
                                setInterestRate(parseFloat(e.target.value) || 0);
                                if (validationError) setValidationError('');
                              }}
                              className={`bg-background ${validationError && (interestRate < 1 || interestRate > 50) ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-border focus-visible:ring-emerald-500'} text-foreground h-11 font-bold text-sm rounded-xl pl-9`} />
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenureMonths" className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            Tenure <span className="text-muted-foreground font-medium text-[10px] bg-muted px-2 py-0.5 rounded-full">Months</span>
                          </Label>
                          <Input id="tenureMonths" type="number" min="1" max="360"
                            value={tenureMonths} onChange={(e) => {
                              setTenureMonths(parseInt(e.target.value) || 0);
                              if (validationError) setValidationError('');
                            }}
                            className={`bg-background ${validationError && (tenureMonths < 1 || tenureMonths > 360) ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-border focus-visible:ring-emerald-500'} text-foreground h-11 font-bold text-sm rounded-xl`} />
                        </div>
                      </div>
                      
                      {validationError && (
                        <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold bg-rose-500/10 p-3 rounded-lg">
                          <WarningCircle className="h-4 w-4" weight="fill" />
                          {validationError}
                        </div>
                      )}

                      <Button type="button" onClick={handleNextStep}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl cursor-pointer text-sm gap-2 flex items-center justify-center transition-all shadow-md">
                        Calculate EMI <ArrowRight className="h-4.5 w-4.5" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="offer1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                      {/* EMI preview */}
                      <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 p-6 rounded-xl text-center shadow-inner">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Monthly EMI</span>
                        <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">{formatCurrency(calculatedEmi)}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col justify-between">
                          <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Principal Amount</span>
                          <span className="font-extrabold text-lg text-slate-900 dark:text-white mt-1">{formatCurrency(app.loanAmount)}</span>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col justify-between">
                          <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Interest & Tenure</span>
                          <span className="font-extrabold text-lg text-slate-900 dark:text-white mt-1">{interestRate}% p.a. <span className="text-muted-foreground font-semibold text-sm">for {tenureMonths} mo</span></span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-lg p-4 flex justify-between items-center shadow-sm">
                        <span className="text-slate-900 dark:text-white font-bold text-sm">Total Repayment Amount</span>
                        <span className="font-extrabold text-xl text-slate-900 dark:text-white">{formatCurrency(calculatedTotalRepayment)}</span>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={() => setOfferStep(0)} disabled={offerLoading}
                          className="flex-1 border-border bg-card text-foreground hover:bg-muted font-bold h-11 rounded-xl cursor-pointer text-sm shadow-sm">
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Edit
                        </Button>
                        <Button type="submit" disabled={offerLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl cursor-pointer text-sm gap-2 shadow-md">
                          <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                          {offerLoading ? 'Generating Offer...' : 'Generate Offer'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
