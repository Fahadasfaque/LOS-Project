'use client';

/**
 * @file page.tsx (/customer/applications/[id])
 * @description Detailed tracker for a single customer application.
 *
 * Tabbed interface:
 * 1. Overview — General metadata of the application
 * 2. Timeline — Track status transitions with customer-friendly labels
 * 3. Documents — View current uploads, see status, or upload replacements
 * 4. Offer — Review generated loan offer, accept or decline it
 * 5. Repayment — Displays mock repayment schedule if loan is disbursed
 *
 * SECURITY: Enforces database-level isolation. Any request to this page for
 * an application not owned by the authenticated customer will fail with a 404.
 */

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCustomerStatus,
  formatINR,
  formatLoanType,
  formatEmploymentType,
  getDaysUntilExpiry,
} from '@/lib/customerStatusMap';
import api from '@/services/api';
import {
  Spinner,
  ArrowLeft,
  Calendar,
  CurrencyInr,
  FileText,
  FolderOpen,
  ClockCounterClockwise,
  Gift,
  HandCoins,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  UploadSimple,
  DownloadSimple,
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
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
}

type TabType = 'overview' | 'timeline' | 'documents' | 'offer' | 'repayment';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerApplicationDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // File upload state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Offer action state
  const [actingOffer, setActingOffer] = useState<'accept' | 'decline' | null>(null);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/customer/applications/${id}`);
      if (res.success && res.data) {
        setApp(res.data);
      } else {
        setError(res.message || 'Application not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        if (action === 'accept') {
          setOfferSuccessMsg('Congratulations! Offer Accepted.');
          // Refresh details to update UI statuses
          await fetchDetail();
        } else {
          setOfferSuccessMsg('Offer declined successfully. Your application is now closed.');
          await fetchDetail();
        }
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
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center max-w-md mx-auto my-12">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
        <h3 className="text-sm font-bold text-foreground mb-1">Error Loading Application</h3>
        <p className="text-xs text-muted-foreground mb-4">{error || 'Application not found.'}</p>
        <button
          onClick={() => router.push('/customer/applications')}
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Applications
        </button>
      </div>
    );
  }

  const statusInfo = getCustomerStatus(app.status);

  return (
    <div className="space-y-6">
      {/* ── Header / Back ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/customer/applications')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Applications
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Application Details
              <span className="font-mono text-muted-foreground text-sm font-medium">({app.applicationNumber})</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                statusInfo.color === 'green'
                  ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
                  : statusInfo.color === 'amber'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                  : statusInfo.color === 'red'
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : statusInfo.color === 'purple'
                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Success confirmation overlay/banner if action was successful ── */}
      {offerSuccessMsg && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-xs font-bold text-foreground">{offerSuccessMsg}</p>
            {app.status === 'OFFER_ACCEPTED' && (
              <div className="text-[11px] text-muted-foreground mt-1 space-y-1">
                <p>Accepted Timestamp: <span className="font-medium text-foreground">{new Date(app.offer?.acceptedAt || '').toLocaleString('en-IN')}</span></p>
                <p>Estimated Disbursement Timeline: <span className="font-semibold text-foreground">1 to 2 business days</span></p>
                <p className="pt-1">
                  <a href="tel:18001234567" className="inline-flex items-center gap-1 bg-primary text-primary-foreground font-semibold px-2.5 py-1 rounded text-[10px] hover:bg-primary/90 mt-1">
                    Contact Loan Officer
                  </a>
                </p>
              </div>
            )}
            {app.status === 'REJECTED' && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Your loan application has been closed at your request. You may start a new application at any time.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div className="border-b border-border">
        <nav className="flex space-x-1" aria-label="Tabs">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<FileText className="h-4 w-4" />} label="Overview" />
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<ClockCounterClockwise className="h-4 w-4" />} label="Timeline" />
          <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FolderOpen className="h-4 w-4" />} label="Documents" />
          <TabButton active={activeTab === 'offer'} onClick={() => setActiveTab('offer')} icon={<Gift className="h-4 w-4" />} label="Offer" />
          {app.status === 'DISBURSED' && (
            <TabButton active={activeTab === 'repayment'} onClick={() => setActiveTab('repayment')} icon={<HandCoins className="h-4 w-4" />} label="Repayment" />
          )}
        </nav>
      </div>

      {/* ── Tab Content Panels ─────────────────────────────────────────── */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab app={app} />}
        {activeTab === 'timeline' && <TimelineTab app={app} />}
        {activeTab === 'documents' && (
          <DocumentsTab
            app={app}
            uploadingDocType={uploadingDocType}
            uploadError={uploadError}
            handleFileUpload={handleFileUpload}
          />
        )}
        {activeTab === 'offer' && (
          <OfferTab
            app={app}
            actingOffer={actingOffer}
            handleOfferAction={handleOfferAction}
          />
        )}
        {activeTab === 'repayment' && app.status === 'DISBURSED' && <RepaymentTab app={app} />}
      </div>
    </div>
  );
}

// ─── TAB COMPONENTS ──────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 py-2 px-3 text-xs font-semibold cursor-pointer transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Overview Tab ──
function OverviewTab({ app }: { app: ApplicationDetail }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Loan details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Loan Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Loan Type" value={formatLoanType(app.loanType)} />
          <Field label="Requested Amount" value={formatINR(app.loanAmount)} />
          <Field label="Applicant Name" value={app.applicantName} />
          <Field label="Employment Type" value={formatEmploymentType(app.employmentType)} />
          <Field label="Monthly Income" value={formatINR(app.monthlyIncome)} />
          <Field
            label="Submitted Date"
            value={new Date(app.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        </div>
      </div>

      {/* Bank officer details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Assigned Team</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {(app.user?.firstName?.[0] || 'L') + (app.user?.lastName?.[0] || 'O')}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {app.user?.firstName} {app.user?.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground">Assigned Loan Officer</p>
            </div>
          </div>
          <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-4">
            <Field label="Contact Phone" value={app.user?.phone || 'N/A'} />
            <Field label="Support Email" value={app.user?.email || 'N/A'} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Timeline Tab ──
function TimelineTab({ app }: { app: ApplicationDetail }) {
  const steps = app.statusHistory;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-foreground">Application Tracking Timeline</h3>
      {steps.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tracking updates recorded.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {steps.map((step, idx) => {
            const friendlyStatus = getCustomerStatus(step.newStatus);
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Node icon */}
                <div
                  className={`absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-background flex items-center justify-center transition-colors ${
                    isLast ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${isLast ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${isLast ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {friendlyStatus.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{friendlyStatus.description}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
                    {new Date(step.changedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Documents Tab ──
interface DocumentsTabProps {
  app: ApplicationDetail;
  uploadingDocType: string | null;
  uploadError: string;
  handleFileUpload: (docType: string, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

function DocumentsTab({
  app,
  uploadingDocType,
  uploadError,
  handleFileUpload,
}: DocumentsTabProps) {
  // Required types
  const requiredTypes = ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h3 className="text-sm font-bold text-foreground">Verification Documents</h3>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          All documents must be PDF, JPG or PNG (Max 5MB)
        </span>
      </div>

      {uploadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 flex items-center gap-2">
          <Warning className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{uploadError}</p>
        </div>
      )}

      <div className="grid gap-3">
        {requiredTypes.map((type) => {
          // Find document record of this type
          const doc = app.documents.find((d) => d.documentType === type);
          const isVerified = doc?.verificationStatus === 'VERIFIED';
          const isPending = doc?.verificationStatus === 'PENDING';
          const isRejected = doc?.verificationStatus === 'REJECTED';

          return (
            <div
              key={type}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20"
            >
              {/* Type Details */}
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-foreground">
                  {type.replace('_', ' ')} Card / Statement
                </p>
                {doc ? (
                  <p className="text-[11px] text-muted-foreground truncate" title={doc.originalName}>
                    File: {doc.originalName}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <Warning className="h-3.5 w-3.5" /> Upload required to process your application
                  </p>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
                {/* Status Badge */}
                {doc && (
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold border ${
                      isVerified
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : isRejected
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle className="h-3 w-3" weight="fill" />
                    ) : isRejected ? (
                      <XCircle className="h-3 w-3" weight="fill" />
                    ) : (
                      <Clock className="h-3 w-3" weight="fill" />
                    )}
                    {doc.verificationStatus}
                  </span>
                )}

                {/* View / Download */}
                {doc && (
                  <a
                    href={doc.secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 px-2.5 items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-foreground cursor-pointer transition-colors"
                  >
                    <DownloadSimple className="h-3.5 w-3.5" />
                    <span>View</span>
                  </a>
                )}

                {/* Upload Button */}
                {!isVerified && (
                  <label className="relative flex h-8 px-3 items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer select-none transition-colors active:scale-95">
                    {uploadingDocType === type ? (
                      <Spinner className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadSimple className="h-3.5 w-3.5" />
                    )}
                    <span>{doc ? 'Replace File' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(type, e)}
                      disabled={uploadingDocType !== null}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Offer Tab ──
interface OfferTabProps {
  app: ApplicationDetail;
  actingOffer: 'accept' | 'decline' | null;
  handleOfferAction: (action: 'accept' | 'decline') => Promise<void>;
}

function OfferTab({ app, actingOffer, handleOfferAction }: OfferTabProps) {
  const offer = app.offer;

  if (!offer) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <Gift className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">No Offer Available</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Your loan application is currently under credit assessment. If approved, a customized offer will appear here.
        </p>
      </div>
    );
  }

  const daysRemaining = getDaysUntilExpiry(offer.expiresAt);
  const isPending = offer.offerStatus === 'GENERATED';
  const isAccepted = offer.offerStatus === 'ACCEPTED';
  const isDeclined = offer.offerStatus === 'DECLINED';
  const isExpired = daysRemaining <= 0 && isPending;

  return (
    <div className="space-y-6">
      {/* Main offer details */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Sanctioned Loan Offer</h3>
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

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-border/50 bg-muted/10">
          <Field label="Sanctioned Amount" value={formatINR(offer.loanAmount)} />
          <Field label="Interest Rate" value={`${offer.interestRate}% p.a.`} />
          <Field label="Tenure Period" value={`${offer.tenureMonths} Months`} />
          <Field label="Monthly EMI Installment" value={formatINR(offer.emiAmount)} />
        </div>

        {/* Expiry / Accepted Date */}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {isPending && !isExpired && (
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
              <Clock className="h-4 w-4" /> This offer expires in {daysRemaining} days (on {new Date(offer.expiresAt).toLocaleDateString('en-IN')})
            </span>
          )}
          {isAccepted && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
              <CheckCircle className="h-4 w-4" weight="fill" /> Accepted on {new Date(offer.acceptedAt || '').toLocaleString('en-IN')}
            </span>
          )}
          {isExpired && (
            <span className="flex items-center gap-1 text-destructive font-semibold">
              <XCircle className="h-4 w-4" weight="fill" /> This offer has expired. Please contact your loan officer to re-generate.
            </span>
          )}
        </div>

        {/* Action center buttons (Only for generated/pending offers) */}
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
              {actingOffer === 'accept' ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : 'Accept Sanction Letter'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Repayment Tab ──
function RepaymentTab({ app }: { app: ApplicationDetail }) {
  const offer = app.offer;
  const disbursement = app.disbursement;

  if (!offer || !disbursement) return null;

  // Simple simulated repayment schedule for first 5 months
  const monthlyRate = offer.interestRate / 12 / 100;
  let balance = offer.loanAmount;
  const schedule = Array.from({ length: Math.min(5, offer.tenureMonths) }).map((_, idx) => {
    const interest = balance * monthlyRate;
    const principal = offer.emiAmount - interest;
    balance -= principal;

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + idx + 1);
    dueDate.setDate(5); // Due on 5th of each month

    return {
      installment: idx + 1,
      dueDate,
      emi: offer.emiAmount,
      principal,
      interest,
      balance: Math.max(0, balance),
    };
  });

  return (
    <div className="space-y-6">
      {/* Disbursement Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground">Loan Disbursement Transaction</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Disbursed Amount" value={formatINR(disbursement.amount)} />
          <Field label="Disbursed On" value={new Date(disbursement.disbursedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <Field label="Transaction Reference" value={disbursement.referenceNumber} className="col-span-2 sm:col-span-1 font-mono font-bold" />
        </div>
      </div>

      {/* Simulated Schedule */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground">Repayment Schedule Overview</h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            First {schedule.length} Installments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                <th className="py-2.5">Installment</th>
                <th className="py-2.5">Due Date</th>
                <th className="py-2.5 text-right">EMI Amount</th>
                <th className="py-2.5 text-right">Principal</th>
                <th className="py-2.5 text-right">Interest</th>
                <th className="py-2.5 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {schedule.map((row) => (
                <tr key={row.installment} className="text-foreground">
                  <td className="py-2.5 font-medium">{row.installment}</td>
                  <td className="py-2.5">
                    {row.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 text-right font-bold">{formatINR(row.emi)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatINR(row.principal)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatINR(row.interest)}</td>
                  <td className="py-2.5 text-right font-semibold text-primary">{formatINR(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          * This is an illustrative repayment schedule. Exact repayment amounts and interest components may vary based on exact bank clearing dates.
        </p>
      </div>
    </div>
  );
}

// ── Small Helper Field Component ──
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
