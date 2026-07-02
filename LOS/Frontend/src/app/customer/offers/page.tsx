'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { formatINR, formatLoanType, getDaysUntilExpiry } from '@/lib/customerStatusMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Gift,
  Spinner,
  CheckCircle,
  XCircle,
  Clock,
  DownloadSimple,
  Warning,
  CircleWavyCheck,
  CurrencyInr,
  CalendarCheck,
  Receipt,
  TrendUp,
} from '@phosphor-icons/react';

interface Offer {
  id: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  offerStatus: string;
  expiresAt: string;
  acceptedAt: string | null;
  generatedAt: string;
}

interface Application {
  id: string;
  applicationNumber: string;
  applicantName: string;
  loanType: string;
  loanAmount: number;
  status: string;
  offer: Offer | null;
}

export default function CustomerOffersPage() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOffer, setActingOffer] = useState<'accept' | 'decline' | null>(null);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const res = await api.get('/customer/applications');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const detailRes = await api.get(`/customer/applications/${res.data[0].id}`);
        if (detailRes.success) setApp(detailRes.data);
      }
    } catch {
      setError('Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOfferAction = async (action: 'accept' | 'decline') => {
    if (!app) return;
    setActingOffer(action);
    setError('');
    try {
      const res = await api.post(`/customer/applications/${app.id}/offer/${action}`, {});
      if (res.success) {
        setOfferSuccessMsg(
          action === 'accept'
            ? 'Congratulations! You have accepted the loan offer. The bank will process your disbursement.'
            : 'Offer declined. Your application is now closed. Please contact your Loan Officer if you have questions.'
        );
        await fetchData();
      } else {
        setError(res.message || `Failed to ${action} offer.`);
      }
    } catch (err: any) {
      setError(err?.message || `Failed to ${action} offer.`);
    } finally {
      setActingOffer(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const offer = app?.offer;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">My Loan Offer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review and respond to your customized loan offer from Fortress Banking.
        </p>
      </div>

      {offerSuccessMsg && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">{offerSuccessMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!app || !offer ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Gift className="h-14 w-14 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No Offer Available Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your loan application is being reviewed. A customized offer will appear here once the credit assessment is complete.
            </p>
          </CardContent>
        </Card>
      ) : (() => {
        const daysRemaining = getDaysUntilExpiry(offer.expiresAt);
        const isPending = offer.offerStatus === 'GENERATED';
        const isAccepted = offer.offerStatus === 'ACCEPTED';
        const isDeclined = offer.offerStatus === 'DECLINED';
        const isExpired = daysRemaining <= 0 && isPending;

        return (
          <>
            {/* Offer KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <CurrencyInr className="h-4 w-4" />, label: 'Sanctioned Amount', value: formatINR(offer.loanAmount), color: 'blue' },
                { icon: <TrendUp className="h-4 w-4" />, label: 'Interest Rate', value: `${offer.interestRate}% p.a.`, color: 'green' },
                { icon: <CalendarCheck className="h-4 w-4" />, label: 'Tenure', value: `${offer.tenureMonths} months`, color: 'amber' },
                { icon: <Receipt className="h-4 w-4" />, label: 'Monthly EMI', value: formatINR(offer.emiAmount), color: 'purple' },
              ].map(({ icon, label, value, color }) => {
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                  green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
                  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                };
                return (
                  <Card key={label} className="border-border">
                    <CardContent className="p-4">
                      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border mb-2.5 ${colorMap[color]}`}>
                        {icon}
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Offer Card */}
            <Card className="border-border">
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Sanctioned Loan Offer</CardTitle>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    isAccepted ? 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400'
                    : isDeclined ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : isExpired ? 'bg-muted/10 text-muted-foreground border-muted-foreground/20'
                    : 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400'
                  }`}>
                    {isExpired ? 'EXPIRED' : offer.offerStatus}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {/* Expiry / Status Alert */}
                {isPending && !isExpired && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <Clock className="h-4 w-4 text-amber-600" weight="fill" />
                    <AlertTitle className="text-amber-700 dark:text-amber-400">Offer Expires Soon</AlertTitle>
                    <AlertDescription className="text-amber-600 dark:text-amber-400">
                      This offer expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> — on {new Date(offer.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
                      Please review and respond before it expires.
                    </AlertDescription>
                  </Alert>
                )}
                {isAccepted && (
                  <Alert className="border-green-500/30 bg-green-500/5">
                    <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
                    <AlertTitle className="text-green-700 dark:text-green-400">Offer Accepted</AlertTitle>
                    <AlertDescription className="text-green-600 dark:text-green-400">
                      Accepted on {new Date(offer.acceptedAt || '').toLocaleString('en-IN')}. Disbursement is in progress.
                    </AlertDescription>
                  </Alert>
                )}
                {isDeclined && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" weight="fill" />
                    <AlertTitle>Offer Declined</AlertTitle>
                    <AlertDescription>You have declined this offer. Please contact your Loan Officer if you wish to reconsider.</AlertDescription>
                  </Alert>
                )}
                {isExpired && (
                  <Alert variant="destructive">
                    <Warning className="h-4 w-4" />
                    <AlertTitle>Offer Expired</AlertTitle>
                    <AlertDescription>This offer has expired. Please contact your Loan Officer to request a new offer.</AlertDescription>
                  </Alert>
                )}

                {/* Offer details */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-4 rounded-xl bg-muted/20 border border-border/50">
                  {[
                    { label: 'Application No.', value: app.applicationNumber },
                    { label: 'Loan Type', value: formatLoanType(app.loanType) },
                    { label: 'Offer Generated On', value: new Date(offer.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Offer Expires On', value: new Date(offer.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {isPending && !isExpired && (
                  <div className="flex items-center gap-3 justify-end pt-1 border-t border-border">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={actingOffer !== null} className="gap-1.5">
                          {actingOffer === 'decline' && <Spinner className="h-3.5 w-3.5 animate-spin" />}
                          Decline Offer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Decline This Offer?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Declining this offer will close it permanently. You will need to contact your Loan Officer to apply again. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Go Back</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleOfferAction('decline')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, Decline
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" disabled={actingOffer !== null} className="gap-1.5">
                          {actingOffer === 'accept' ? (
                            <Spinner className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CircleWavyCheck className="h-4 w-4" weight="fill" />
                          )}
                          Accept Sanction Letter
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Offer Acceptance</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-2">
                              <p>You are accepting the following loan terms:</p>
                              <div className="rounded-lg bg-muted p-3 space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount:</span><strong>{formatINR(offer.loanAmount)}</strong></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate:</span><strong>{offer.interestRate}% p.a.</strong></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Tenure:</span><strong>{offer.tenureMonths} months</strong></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Monthly EMI:</span><strong>{formatINR(offer.emiAmount)}</strong></div>
                              </div>
                              <p className="text-xs text-muted-foreground">By confirming, you agree to the loan terms and conditions set by Fortress Banking.</p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Review Again</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleOfferAction('accept')}>
                            Confirm & Accept
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {isAccepted && (
                  <div className="flex justify-end pt-1 border-t border-border">
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/customer/applications/${app.id}/sanction-letter`}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <DownloadSimple className="h-4 w-4" />
                        Download Sanction Letter (PDF)
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );
      })()}
    </div>
  );
}
