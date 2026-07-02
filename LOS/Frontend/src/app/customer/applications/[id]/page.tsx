'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCustomerStatus,
  formatINR,
  formatLoanType,
  formatEmploymentType,
  getDaysUntilExpiry,
  PROGRESS_STEPS,
} from '@/lib/customerStatusMap';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Spinner,
  ArrowLeft,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  UploadSimple,
  DownloadSimple,
  Gift,
  HandCoins,
  FileText,
  CurrencyInr,
  CalendarCheck,
  Receipt,
  User,
  Briefcase,
  Phone,
  Envelope,
  MapPin,
} from '@phosphor-icons/react';

interface Document {
  id: string;
  documentType: string;
  originalName: string;
  secureUrl: string;
  verificationStatus: string;
  uploadedAt: string;
}

interface StatusHistory {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
  changedBy?: string;
}

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

interface Disbursement {
  id: string;
  amount: number;
  referenceNumber: string;
  status: string;
  disbursedAt: string;
}

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  loanType: string;
  loanAmount: number;
  monthlyIncome: number;
  employmentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  statusHistory: StatusHistory[];
  offer: Offer | null;
  disbursement: Disbursement | null;
}

const REQUIRED_DOC_TYPES = ['AADHAAR', 'PAN', 'INCOME_PROOF', 'BANK_STATEMENT'];

const statusBadgeClass: Record<string, string> = {
  green: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  red: 'bg-destructive/10 text-destructive border-destructive/30',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400',
  blue: 'bg-primary/10 text-primary border-primary/30',
};

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xs font-semibold text-foreground ${className ?? ''}`}>{value || '—'}</p>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ app }: { app: ApplicationDetail }) {
  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> Applicant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Full Name" value={app.applicantName} />
            <Field label="Email" value={app.email} />
            <Field label="Phone" value={app.phone} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Loan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Loan Type" value={formatLoanType(app.loanType)} />
            <Field label="Applied Amount" value={formatINR(app.loanAmount)} />
            <Field label="Monthly Income" value={formatINR(app.monthlyIncome)} />
            <Field label="Employment Type" value={formatEmploymentType(app.employmentType)} />
            <Field label="Application Number" value={app.applicationNumber} className="font-mono" />
            <Field label="Submitted On" value={new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────
function DocumentsTab({
  app,
  uploadingDocType,
  uploadError,
  onFileUpload,
}: {
  app: ApplicationDetail;
  uploadingDocType: string | null;
  uploadError: string;
  onFileUpload: (docType: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const rejectedDocs = app.documents.filter((d) => d.verificationStatus === 'REJECTED');
  return (
    <div className="space-y-4">
      {rejectedDocs.length > 0 && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertTitle>Action Required — Document Expiry/Rejection</AlertTitle>
          <AlertDescription>
            {rejectedDocs.length} document{rejectedDocs.length > 1 ? 's have' : ' has'} been rejected. Please re-upload them to avoid delays.
          </AlertDescription>
        </Alert>
      )}
      {uploadError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-bold">Required Documents</CardTitle>
          <p className="text-xs text-muted-foreground">Max file size: 5MB. Supported: PDF, JPG, PNG</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Document</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">File</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REQUIRED_DOC_TYPES.map((type) => {
                  const doc = app.documents.find((d) => d.documentType === type);
                  const isVerified = doc?.verificationStatus === 'VERIFIED';
                  const isRejected = doc?.verificationStatus === 'REJECTED';

                  return (
                    <TableRow key={type} className="hover:bg-muted/30 border-border/50">
                      <TableCell className="text-xs font-semibold text-foreground py-3.5">
                        {type.replace(/_/g, ' ')} Card / Statement
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3.5 max-w-[180px] truncate">
                        {doc ? (
                          <span title={doc.originalName}>{doc.originalName}</span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Not uploaded</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {!doc ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Required
                          </Badge>
                        ) : isVerified ? (
                          <Badge variant="outline" className="text-[10px] border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" weight="fill" /> Verified
                          </Badge>
                        ) : isRejected ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <XCircle className="h-3 w-3 mr-1" weight="fill" /> Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">
                            <Clock className="h-3 w-3 mr-1" weight="fill" /> Under Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {doc && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => window.open(doc.secureUrl, '_blank')}>
                              <DownloadSimple className="h-3 w-3" /> View
                            </Button>
                          )}
                          {!isVerified && (
                            <label className="relative inline-flex cursor-pointer">
                              <Button type="button" size="sm" variant="default" className="h-7 text-xs gap-1 pointer-events-none" disabled={uploadingDocType !== null}>
                                {uploadingDocType === type ? (
                                  <Spinner className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UploadSimple className="h-3 w-3" />
                                )}
                                {doc ? 'Replace' : 'Upload'}
                              </Button>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => onFileUpload(type, e)}
                                disabled={uploadingDocType !== null}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </label>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Offer Tab ────────────────────────────────────────────────────────────────
function OfferTab({
  app,
  actingOffer,
  offerSuccessMsg,
  handleOfferAction,
}: {
  app: ApplicationDetail;
  actingOffer: 'accept' | 'decline' | null;
  offerSuccessMsg: string;
  handleOfferAction: (action: 'accept' | 'decline') => Promise<void>;
}) {
  const offer = app.offer;
  if (!offer) {
    return (
      <Card className="border-border">
        <CardContent className="p-10 text-center">
          <Gift className="h-14 w-14 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Offer Available</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your loan application is currently under credit assessment. A customized offer will appear here once approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getDaysUntilExpiry(offer.expiresAt);
  const isPending = offer.offerStatus === 'GENERATED';
  const isAccepted = offer.offerStatus === 'ACCEPTED';
  const isDeclined = offer.offerStatus === 'DECLINED';
  const isExpired = daysRemaining <= 0 && isPending;

  return (
    <div className="space-y-4">
      {offerSuccessMsg && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">{offerSuccessMsg}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Sanctioned Loan Offer</CardTitle>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
              isAccepted ? statusBadgeClass.green
              : isDeclined ? statusBadgeClass.red
              : isExpired ? 'bg-muted/10 text-muted-foreground border-muted-foreground/20'
              : statusBadgeClass.purple
            }`}>
              {isExpired ? 'EXPIRED' : offer.offerStatus}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Sanctioned Amount</p>
              <p className="text-sm font-bold text-foreground">{formatINR(offer.loanAmount)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Interest Rate</p>
              <p className="text-sm font-bold text-foreground">{offer.interestRate}% p.a.</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Tenure</p>
              <p className="text-sm font-bold text-foreground">{offer.tenureMonths} Months</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Monthly EMI</p>
              <p className="text-sm font-bold text-foreground">{formatINR(offer.emiAmount)}</p>
            </div>
          </div>

          {isPending && !isExpired && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Clock className="h-4 w-4 text-amber-600" weight="fill" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 font-semibold">
                This offer expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} — on {new Date(offer.expiresAt).toLocaleDateString('en-IN')}
              </AlertDescription>
            </Alert>
          )}
          {isAccepted && (
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
              <AlertDescription className="text-green-700 dark:text-green-400 font-semibold">
                Accepted on {new Date(offer.acceptedAt || '').toLocaleString('en-IN')}
              </AlertDescription>
            </Alert>
          )}
          {isExpired && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" weight="fill" />
              <AlertDescription>
                This offer has expired. Please contact your Loan Officer to re-generate a new offer.
              </AlertDescription>
            </Alert>
          )}

          {isPending && !isExpired && (
            <div className="flex items-center gap-3 justify-end pt-1">
              <AlertDialog>
                <AlertDialogTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })} disabled={actingOffer !== null}>
                  {actingOffer === 'decline' ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : null}
                  Decline Offer
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Decline This Offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Declining will close this offer. You may need to contact your Loan Officer to apply again. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleOfferAction('decline')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, Decline
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger className={buttonVariants({ size: "sm", className: "gap-1.5" })} disabled={actingOffer !== null}>
                  {actingOffer === 'accept' ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" weight="fill" />}
                  Accept Sanction Letter
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accept Loan Offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are accepting a loan of <strong>{formatINR(offer.loanAmount)}</strong> at <strong>{offer.interestRate}% p.a.</strong> for <strong>{offer.tenureMonths} months</strong> with an EMI of <strong>{formatINR(offer.emiAmount)}/month</strong>. Please review the terms before proceeding.
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
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={async () => {
                try {
                  const token = localStorage.getItem('los_token');
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/customer/applications/${app.id}/sanction-letter`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (!res.ok) throw new Error('Failed to download');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `SanctionLetter-${app.applicationNumber}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  console.error('Download error:', e);
                  alert('Failed to download sanction letter.');
                }
              }}>
                <DownloadSimple className="h-4 w-4" />
                Download Sanction Letter (PDF)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Repayment Tab ────────────────────────────────────────────────────────────
function RepaymentTab({ app }: { app: ApplicationDetail }) {
  const offer = app.offer;
  const disbursement = app.disbursement;

  if (!offer || !disbursement) {
    return (
      <Card className="border-border">
        <CardContent className="p-10 text-center">
          <HandCoins className="h-14 w-14 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Repayment Details Unavailable</h3>
          <p className="text-xs text-muted-foreground">Your repayment schedule will appear here once your loan is disbursed.</p>
        </CardContent>
      </Card>
    );
  }

  const monthlyRate = offer.interestRate / 12 / 100;
  let balance = offer.loanAmount;
  const schedule = Array.from({ length: Math.min(6, offer.tenureMonths) }).map((_, idx) => {
    const interest = balance * monthlyRate;
    const principal = offer.emiAmount - interest;
    balance -= principal;
    const dueDate = new Date(disbursement.disbursedAt);
    dueDate.setMonth(dueDate.getMonth() + idx + 1);
    dueDate.setDate(5);
    return { installment: idx + 1, dueDate, emi: offer.emiAmount, principal, interest, balance: Math.max(0, balance) };
  });

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-bold">Loan Disbursement</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Disbursed Amount" value={formatINR(disbursement.amount)} />
            <Field label="Disbursed On" value={new Date(disbursement.disbursedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <Field label="Transaction Reference" value={disbursement.referenceNumber} className="font-mono" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold">Repayment Schedule Overview</CardTitle>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">First {schedule.length} Installments</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">#</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Due Date</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">EMI</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Principal</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Interest</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((row) => (
                  <TableRow key={row.installment} className="hover:bg-muted/30 border-border/50">
                    <TableCell className="text-xs font-medium py-3">{row.installment}</TableCell>
                    <TableCell className="text-xs py-3">{row.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="text-xs font-bold text-right py-3">{formatINR(row.emi)}</TableCell>
                    <TableCell className="text-xs text-right py-3">{formatINR(Math.round(row.principal))}</TableCell>
                    <TableCell className="text-xs text-right py-3">{formatINR(Math.round(row.interest))}</TableCell>
                    <TableCell className="text-xs font-semibold text-right py-3">{formatINR(Math.round(row.balance))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Timeline Tab (NEW) ────────────────────────────────────────────────────────
function TimelineTab({ app }: { app: ApplicationDetail }) {
  const history = [...(app.statusHistory || [])].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  if (history.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-10 text-center">
          <Clock className="h-14 w-14 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Timeline Yet</h3>
          <p className="text-xs text-muted-foreground">Your application journey will appear here as it progresses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-bold">Application Journey</CardTitle>
        <p className="text-xs text-muted-foreground">A chronological record of your loan application progress</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {history.map((event, idx) => {
              const statusInfo = getCustomerStatus(event.newStatus);
              const isLast = idx === history.length - 1;
              const dotColor = {
                green: 'bg-green-500 border-green-500',
                amber: 'bg-amber-500 border-amber-500',
                red: 'bg-destructive border-destructive',
                purple: 'bg-purple-500 border-purple-500',
                blue: 'bg-primary border-primary',
              }[statusInfo.color];

              return (
                <div key={event.id} className="flex gap-4 pl-1">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 relative ${
                      isLast ? dotColor + ' text-white' : 'bg-background border-border text-muted-foreground'
                    }`}>
                      {isLast
                        ? <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                        : <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                      }
                    </div>
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-foreground">{statusInfo.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{statusInfo.description}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {new Date(event.changedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                        {' '}·{' '}
                        {new Date(event.changedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {event.oldStatus && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Moved from: {getCustomerStatus(event.oldStatus).label}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [actingOffer, setActingOffer] = useState<'accept' | 'decline' | null>(null);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/customer/applications/${id}`);
      if (res.success) {
        setApp(res.data);
      } else {
        setError(res.message || 'Application not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    setUploadingDocType(docType);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', id);
    formData.append('documentType', docType);

    try {
      const res = await api.postFormData('/customer/documents', formData);
      if (res.success) {
        await fetchDetail();
      } else {
        setUploadError(res.message || 'Upload failed.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleOfferAction = async (action: 'accept' | 'decline') => {
    setActingOffer(action);
    setError('');
    try {
      const res = await api.post(`/customer/applications/${id}/offer/${action}`, {});
      if (res.success) {
        setOfferSuccessMsg(
          action === 'accept'
            ? 'Congratulations! Your offer has been accepted successfully.'
            : 'Offer declined. Your application is now closed.'
        );
        await fetchDetail();
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
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 max-w-md mx-auto my-12">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">Error Loading Application</h3>
          <p className="text-xs text-muted-foreground mb-4">{error || 'Application not found.'}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/customer/applications')} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Applications
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getCustomerStatus(app.status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/customer/applications')} className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">Application Details</h1>
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {app.applicationNumber}
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${statusBadgeClass[statusInfo.color]}`}>
          {statusInfo.label}
        </span>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          <TabsTrigger value="offer" className="text-xs">Offer</TabsTrigger>
          <TabsTrigger value="repayment" className="text-xs">Repayment</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab app={app} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTab
            app={app}
            uploadingDocType={uploadingDocType}
            uploadError={uploadError}
            onFileUpload={handleFileUpload}
          />
        </TabsContent>

        <TabsContent value="offer" className="mt-4">
          <OfferTab
            app={app}
            actingOffer={actingOffer}
            offerSuccessMsg={offerSuccessMsg}
            handleOfferAction={handleOfferAction}
          />
        </TabsContent>

        <TabsContent value="repayment" className="mt-4">
          <RepaymentTab app={app} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab app={app} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
