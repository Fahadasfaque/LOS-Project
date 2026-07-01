'use client';

/**
 * @file page.tsx (/customer/offers)
 * @description Customer Loan Offers Page.
 *
 * Checks if the customer has an active application and displays its offer details.
 * Allows downloading the Sanction Letter PDF and accepting/declining the offer.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import {
  getCustomerStatus,
  formatINR,
  formatLoanType,
  getDaysUntilExpiry,
} from '@/lib/customerStatusMap';
import {
  Gift,
  Spinner,
  CheckCircle,
  XCircle,
  Clock,
  DownloadSimple,
  Warning,
  ArrowRight,
  Phone,
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
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOffer, setActingOffer] = useState<'accept' | 'decline' | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOffer = async () => {
    try {
      const res = await api.get('/customer/applications');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Fetch detailed application to retrieve the linked offer object
        const detailRes = await api.get(`/customer/applications/${res.data[0].id}`);
        if (detailRes.success) {
          setApp(detailRes.data);
        }
      }
    } catch {
      setError('Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer();
  }, []);

  const handleOfferAction = async (action: 'accept' | 'decline') => {
    if (!app) return;
    setActingOffer(action);
    setError('');
    try {
      const res = await api.post(`/customer/applications/${app.id}/offer/${action}`, {});
      if (res.success) {
        if (action === 'accept') {
          setSuccessMsg('Congratulations! Offer Accepted.');
        } else {
          setSuccessMsg('Offer declined successfully. Your application is now closed.');
        }
        await fetchOffer();
      } else {
        setError(res.message || `Failed to ${action} offer.`);
      }
    } catch (err: any) {
      setError(err?.message || `Failed to ${action} offer.`);
    } finally {
      setActingOffer(null);
    }
  };

  const downloadMockPDF = () => {
    if (!app || !app.offer) return;
    const offer = app.offer;

    // Generate simple text representation simulating a Sanction Letter PDF
    const content = `
=========================================
FORTRESS BANKING — SANCTION LETTER
=========================================
Application Number: ${app.applicationNumber}
Applicant Name:     ${app.applicantName}
Sanctioned Date:    ${new Date(offer.generatedAt).toLocaleDateString('en-IN')}
Expiry Date:        ${new Date(offer.expiresAt).toLocaleDateString('en-IN')}

LOAN SPECIFICATIONS:
----------------------------
Sanctioned Amount:  ₹${offer.loanAmount.toLocaleString('en-IN')}
Interest Rate:      ${offer.interestRate}% p.a. (Fixed)
Tenure Period:      ${offer.tenureMonths} Months
Monthly EMI:        ₹${offer.emiAmount.toLocaleString('en-IN')}

TERMS AND CONDITIONS:
----------------------------
1. The borrower agrees to repay the loan in monthly installments as stated above.
2. The interest rate remains fixed for the entire tenure of the loan.
3. Fortress Banking reserves the right to recall the facility under material adverse change.

=========================================
This is a computer generated document and does not require physical signature.
=========================================
    `;

    const blob = new Blob([content.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sanction_Letter_${app.applicationNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!app || !app.offer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Offer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review and sign your loan agreement sanction letter.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <Gift className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Sanctioned Offer Available</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            If your application is currently under credit evaluation, your offer will appear here immediately after the approver signs off.
          </p>
          {app && (
            <Link
              href={`/customer/applications/${app.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              Track Application Progress <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  const offer = app.offer;
  const daysRemaining = getDaysUntilExpiry(offer.expiresAt);
  const isPending = offer.offerStatus === 'GENERATED';
  const isAccepted = offer.offerStatus === 'ACCEPTED';
  const isDeclined = offer.offerStatus === 'DECLINED';
  const isExpired = daysRemaining <= 0 && isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Offer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review and respond to the sanctioned loan terms from Fortress Banking.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <Warning className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-xs font-bold text-foreground">{successMsg}</p>
            {isAccepted && (
              <div className="text-[11px] text-muted-foreground mt-1.5 space-y-1">
                <p>Accepted Timestamp: <span className="font-medium text-foreground">{new Date(offer.acceptedAt || '').toLocaleString('en-IN')}</span></p>
                <p>Estimated Disbursement: <span className="font-semibold text-foreground">1 to 2 business days</span></p>
                <button
                  onClick={() => router.push(`/customer/applications/${app.id}`)}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold px-2.5 py-1.5 rounded text-[10px] hover:bg-primary/95 transition-all mt-2 cursor-pointer"
                >
                  Track Disbursement
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/50 pb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Application Number
            </p>
            <p className="text-sm font-mono font-bold text-foreground">{app.applicationNumber}</p>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                isAccepted
                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                  : isDeclined
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : isExpired
                  ? 'bg-muted/10 text-muted-foreground border-muted-foreground/20'
                  : 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
              }`}
            >
              {isExpired ? 'EXPIRED' : offer.offerStatus}
            </span>
          </div>
        </div>

        {/* Offer Terms */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-border/50 bg-muted/10">
          <Field label="Sanctioned Amount" value={formatINR(offer.loanAmount)} />
          <Field label="Interest Rate" value={`${offer.interestRate}% p.a.`} />
          <Field label="Tenure Period" value={`${offer.tenureMonths} Months`} />
          <Field label="Monthly EMI" value={formatINR(offer.emiAmount)} />
        </div>

        {/* Expiry Banner */}
        {isPending && !isExpired && (
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
            <Clock className="h-4 w-4" />
            <span>
              This offer is valid for {daysRemaining} more days. Please review and respond by{' '}
              {new Date(offer.expiresAt).toLocaleDateString('en-IN')}.
            </span>
          </div>
        )}

        {/* Download Sanction Letter */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/5">
          <div className="flex items-center gap-2">
            <DownloadSimple className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-bold text-foreground">Sanction Letter (PDF)</p>
              <p className="text-[10px] text-muted-foreground">Download the printable terms and loan agreement document.</p>
            </div>
          </div>
          <button
            onClick={downloadMockPDF}
            className="flex h-8 px-3 items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors"
          >
            <span>Download</span>
          </button>
        </div>

        {/* Action Panel */}
        {isPending && !isExpired && (
          <div className="pt-3 border-t border-border flex items-center gap-3 justify-end">
            <button
              onClick={() => handleOfferAction('decline')}
              disabled={actingOffer !== null}
              className="flex h-10 px-4 items-center justify-center rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {actingOffer === 'decline' ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : 'Decline Offer'}
            </button>
            <button
              onClick={() => handleOfferAction('accept')}
              disabled={actingOffer !== null}
              className="flex h-10 px-5 items-center justify-center rounded-lg bg-primary hover:bg-primary/95 text-xs font-bold text-primary-foreground shadow cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
            >
              {actingOffer === 'accept' ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : 'Accept & Agree'}
            </button>
          </div>
        )}

        {/* Declined Info */}
        {isDeclined && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 flex items-center gap-2 text-xs text-destructive font-semibold">
            <XCircle className="h-4 w-4" weight="fill" />
            <span>You declined this loan offer. This application is now closed.</span>
          </div>
        )}

        {/* Expired Info */}
        {isExpired && (
          <div className="rounded-lg border border-muted-foreground/20 bg-muted/5 px-3 py-2.5 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Clock className="h-4 w-4" />
            <span>This offer has expired. Contact your Loan Officer to re-evaluate your request.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-xs font-semibold text-foreground ${className}`}>{value}</p>
    </div>
  );
}
