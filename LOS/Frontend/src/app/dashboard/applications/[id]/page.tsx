'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Clock,
  Warning,
  ArrowsCounterClockwise,
  ShieldCheck,
  X,
  ClockCounterClockwise,
  Eye,
  Trash,
  ArrowLeft,
  CheckCircle,
  Calculator,
  UploadSimple,
  Percent,
  CurrencyInr,
  Pulse,
  User,
  Envelope,
  Phone,
  IdentificationCard,
  Briefcase,
  Bank,
  TrendUp,
  Hourglass,
  XCircle,
  CheckSquare,
  PaperPlaneTilt,
  Star,
  ArrowRight,
  Lock,
  Sparkle,
  MagnifyingGlass,
  SealCheck,
  Confetti,
  Buildings,
} from '@phosphor-icons/react';
import { PdfViewer } from '@/components/ui/PdfViewer';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// ─── Type Definitions ──────────────────────────────────────────────────────────

interface DocumentItem {
  id: string;
  documentType: 'PAN' | 'AADHAAR' | 'SALARY_SLIP' | 'BANK_STATEMENT';
  originalName: string;
  publicId: string;
  secureUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
}

interface StatusHistoryItem {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
  changedBy: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface AssessmentDetails {
  id: string;
  status: 'PENDING' | 'COMPLETED';
  creditScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
  assessmentNotes: string;
  assessedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  assessedAt: string;
}

interface OfferDetails {
  id: string;
  applicationId: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  offerStatus: 'GENERATED' | 'ACCEPTED' | 'DECLINED';
  generatedAt: string;
  acceptedAt: string | null;
  expiresAt: string;
}

interface DisbursementDetails {
  id: string;
  applicationId: string;
  amount: number;
  referenceNumber: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  disbursedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  disbursedAt: string;
}

interface ApplicationDetails {
  id: string;
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  pan: string;
  loanType: string;
  loanAmount: number;
  monthlyIncome: number;
  employmentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  documents: DocumentItem[];
  statusHistory: StatusHistoryItem[];
  userId: string;
  assessment?: AssessmentDetails | null;
  offer?: OfferDetails | null;
  disbursement?: DisbursementDetails | null;
}

// ─── Workflow Pipeline Config ──────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'DRAFT', label: 'Draft', short: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted', short: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review', short: 'Review' },
  { key: 'APPROVED', label: 'Approved', short: 'Approved' },
  { key: 'OFFER_GENERATED', label: 'Offer Sent', short: 'Offer' },
  { key: 'OFFER_ACCEPTED', label: 'Accepted', short: 'Accepted' },
  { key: 'DISBURSED', label: 'Disbursed', short: 'Funded' },
];

const STAGE_ORDER: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  UNDER_REVIEW: 2,
  APPROVED: 3,
  OFFER_GENERATED: 4,
  OFFER_ACCEPTED: 5,
  DISBURSED: 6,
  REJECTED: -1,
};

// ─── Role Config ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  label: string;
  accentClass: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ReactNode;
}> = {
  LOAN_OFFICER: {
    label: 'Loan Officer',
    accentClass: 'primary',
    headerBg: 'bg-primary/5',
    headerBorder: 'border-primary/20',
    headerText: 'text-primary',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/20',
    icon: <Briefcase className="h-3 w-3" weight="bold" />,
  },
  CREDIT_ANALYST: {
    label: 'Credit Analyst',
    accentClass: 'amber',
    headerBg: 'bg-amber-500/5',
    headerBorder: 'border-amber-500/20',
    headerText: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-500/20',
    icon: <MagnifyingGlass className="h-3 w-3" weight="bold" />,
  },
  APPROVER: {
    label: 'Approver',
    accentClass: 'emerald',
    headerBg: 'bg-emerald-500/5',
    headerBorder: 'border-emerald-500/20',
    headerText: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-500/20',
    icon: <SealCheck className="h-3 w-3" weight="bold" />,
  },
  SUPER_ADMIN: {
    label: 'Super Admin',
    accentClass: 'violet',
    headerBg: 'bg-violet-500/5',
    headerBorder: 'border-violet-500/20',
    headerText: 'text-violet-700 dark:text-violet-400',
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-700 dark:text-violet-400',
    badgeBorder: 'border-violet-500/20',
    icon: <Star className="h-3 w-3" weight="fill" />,
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ApplicationDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [app, setApp] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Document upload state
  const [selectedDocType, setSelectedDocType] = useState<'PAN' | 'AADHAAR' | 'SALARY_SLIP' | 'BANK_STATEMENT'>('PAN');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Document preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Assessment workflow state
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [previewAssessment, setPreviewAssessment] = useState<{
    creditScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
  } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Offer generation workflow state
  const [offerStep, setOfferStep] = useState(0);
  const [interestRate, setInterestRate] = useState<number>(10.5);
  const [tenureMonths, setTenureMonths] = useState<number>(36);
  const [offerLoading, setOfferLoading] = useState(false);

  // Disbursement workflow state
  const [disburseLoading, setDisburseLoading] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/applications/${id}`);
      if (res.success && res.data) {
        setApp(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusTransition = async (targetStatus: string) => {
    setActionLoading(true);
    try {
      if (targetStatus === 'SUBMITTED') {
        await api.post(`/applications/${id}/submit`, {});
        toast.success('Application submitted for credit review.');
      } else {
        await api.put(`/applications/${id}/status`, { status: targetStatus });
        toast.success(`Application moved to ${targetStatus.replace(/_/g, ' ')}.`);
      }
      await fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update application status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunAssessment = () => {
    if (!app) return;
    const income = app.monthlyIncome;
    let creditScore = 620;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
    let recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' = 'REJECT';
    if (income >= 50000) { creditScore = 780; riskLevel = 'LOW'; recommendation = 'APPROVE'; }
    else if (income >= 30000) { creditScore = 700; riskLevel = 'MEDIUM'; recommendation = 'MANUAL_REVIEW'; }
    setPreviewAssessment({ creditScore, riskLevel, recommendation });
    setAssessmentStep(1);
  };

  const handleSaveAssessment = async () => {
    if (!previewAssessment) { toast.error('Please run the assessment check first.'); return; }
    if (!assessmentNotes.trim()) { toast.error('Assessment notes are required.'); return; }
    setSaveLoading(true);
    try {
      const res = await api.post('/assessments', { applicationId: id, creditScore: previewAssessment.creditScore, assessmentNotes });
      if (res.success) {
        toast.success('Credit assessment locked successfully.');
        setAssessmentNotes('');
        setPreviewAssessment(null);
        setAssessmentStep(0);
        await fetchDetails();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit credit assessment.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGenerateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestRate || interestRate <= 0 || !tenureMonths || tenureMonths <= 0) {
      toast.error('Interest rate and tenure must be valid positive numbers.');
      return;
    }
    setOfferLoading(true);
    try {
      const res = await api.post('/offers/generate', { applicationId: id, interestRate, tenureMonths });
      if (res.success) { toast.success('Loan offer generated and sent to customer.'); await fetchDetails(); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate offer.');
    } finally {
      setOfferLoading(false);
    }
  };

  const handleDisburseLoan = async () => {
    setDisburseLoading(true);
    try {
      const res = await api.post('/disbursements', { applicationId: id });
      if (res.success) { toast.success('Funds disbursed successfully.'); await fetchDetails(); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute disbursement.');
    } finally {
      setDisburseLoading(false);
    }
  };

  const handleDocumentUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) { toast.error('Please select a file to upload.'); return; }
    setUploadLoading(true);
    setUploadProgress(20);
    try {
      const formData = new FormData();
      formData.append('applicationId', id);
      formData.append('documentType', selectedDocType);
      formData.append('file', selectedFile);
      setUploadProgress(50);
      const res = await api.postFormData('/documents', formData);
      if (res.success) {
        setUploadProgress(100);
        toast.success(`Document uploaded: ${selectedFile.name}.`);
        setSelectedFile(null);
        setUploadProgress(0);
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await fetchDetails();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document.');
      setUploadProgress(0);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${encodeURIComponent(publicId)}`);
      toast.success('Document deleted.');
      await fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document.');
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.put(`/documents/${docId}/status`, { status });
      toast.success(`Document marked as ${status.toLowerCase()}.`);
      await fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document status.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only PDF, JPG, PNG are allowed.'); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error('File size exceeds 10MB.'); return; }
      setSelectedFile(file);
    }
  };

  // ─── Helper Functions ──────────────────────────────────────────────────────

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const calculatedEmi = (() => {
    const P = app?.loanAmount || 0;
    const r = interestRate / 12 / 100;
    const n = tenureMonths;
    if (!P || !n) return 0;
    if (r === 0) return P / n;
    return Math.round(((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) * 100) / 100;
  })();
  const calculatedTotalRepayment = calculatedEmi * tenureMonths;

  const getStatusBadge = (statusStr: string) => {
    const base = 'inline-flex items-center rounded border text-[10px] font-bold tracking-wide uppercase font-mono px-2.5 py-0.5';
    const map: Record<string, string> = {
      DRAFT: `${base} border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400`,
      SUBMITTED: `${base} border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 animate-pulse`,
      UNDER_REVIEW: `${base} border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400`,
      APPROVED: `${base} border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400`,
      OFFER_GENERATED: `${base} border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 animate-pulse`,
      OFFER_ACCEPTED: `${base} border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400`,
      REJECTED: `${base} border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400`,
      DISBURSED: `${base} border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400`,
    };
    const label: Record<string, string> = {
      DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved',
      OFFER_GENERATED: 'Awaiting Response', OFFER_ACCEPTED: 'Offer Accepted', REJECTED: 'Rejected', DISBURSED: 'Disbursed',
    };
    return <span className={map[statusStr] || `${base} border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400`}>{label[statusStr] || statusStr}</span>;
  };

  const getCombinedTimeline = () => {
    if (!app) return [];
    const events: any[] = [];
    app.statusHistory.forEach((hist) => {
      const labelMap: Record<string, string> = {
        DRAFT: 'Application Drafted', SUBMITTED: 'Application Submitted', UNDER_REVIEW: 'Credit Review Started',
        APPROVED: 'Application Approved', OFFER_GENERATED: 'Loan Offer Issued', OFFER_ACCEPTED: 'Customer Acceptance Recorded',
        REJECTED: 'Application Rejected', DISBURSED: 'Funds Disbursed',
      };
      const colorMap: Record<string, string> = {
        APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        DISBURSED: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
        OFFER_ACCEPTED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        OFFER_GENERATED: 'bg-primary/10 text-primary border border-primary/20',
      };
      events.push({
        id: `status-${hist.id}`, type: 'STATUS_CHANGE',
        title: labelMap[hist.newStatus] || `→ ${hist.newStatus}`,
        timestamp: hist.changedAt, changedBy: hist.changedBy,
        description: hist.oldStatus ? `Status moved from ${hist.oldStatus} → ${hist.newStatus}.` : `Application initialized as ${hist.newStatus}.`,
        badgeColor: colorMap[hist.newStatus] || 'bg-muted text-muted-foreground border border-border',
      });
    });
    if (app.assessment?.status === 'COMPLETED') {
      events.push({
        id: `assessment-${app.assessment.id}`, type: 'ASSESSMENT',
        title: 'Credit Report Locked',
        timestamp: app.assessment.assessedAt, changedBy: app.assessment.assessedBy,
        description: `Score: ${app.assessment.creditScore} · Risk: ${app.assessment.riskLevel} · Rec: ${app.assessment.recommendation}`,
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      });
    }
    if (app.offer) {
      events.push({
        id: `offer-${app.offer.id}`, type: 'OFFER',
        title: 'Loan Offer Generated',
        timestamp: app.offer.generatedAt, changedBy: null,
        description: `${formatCurrency(app.offer.loanAmount)} @ ${app.offer.interestRate}% p.a. · ${app.offer.tenureMonths}mo · EMI ${formatCurrency(app.offer.emiAmount)}`,
        badgeColor: 'bg-primary/10 text-primary border border-primary/20',
      });
      if (app.offer.acceptedAt) {
        events.push({
          id: `offer-accepted-${app.offer.id}`, type: 'OFFER_ACCEPTED',
          title: 'Offer Accepted by Customer',
          timestamp: app.offer.acceptedAt, changedBy: null,
          description: `Customer accepted lending terms. Monthly EMI: ${formatCurrency(app.offer.emiAmount)}.`,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        });
      }
    }
    if (app.disbursement) {
      events.push({
        id: `disb-${app.disbursement.id}`, type: 'DISBURSEMENT',
        title: 'Funds Released',
        timestamp: app.disbursement.disbursedAt, changedBy: app.disbursement.disbursedBy,
        description: `Txn Ref: ${app.disbursement.referenceNumber} · ${formatCurrency(app.disbursement.amount)}`,
        badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
      });
    }
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // ─── Loading Skeleton ──────────────────────────────────────────────────────

  if (loading && !app) {
    return (
      <div className="w-full space-y-6 pb-10 animate-pulse">
        <div className="flex items-start gap-4 border-b border-border pb-5">
          <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-7 w-64 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
          <div className="h-9 w-32 rounded-lg bg-muted" />
        </div>
        <div className="h-12 w-full rounded-xl bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 rounded-xl bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
          </div>
          <div className="space-y-6">
            <div className="h-72 rounded-xl bg-muted" />
            <div className="h-56 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────

  if (error && !app) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-border rounded-xl text-center space-y-4 shadow-sm">
        <Warning className="h-12 w-12 text-destructive mx-auto" weight="fill" />
        <h3 className="text-lg font-bold text-foreground">Error Retrieving Application</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} variant="outline" className="border-border bg-card text-foreground hover:bg-muted cursor-pointer font-bold rounded-lg text-xs h-9 px-4">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Go Back
        </Button>
      </div>
    );
  }

  if (!user || !app) return null;

  // ─── Role Helpers ──────────────────────────────────────────────────────────

  const role = user.role as keyof typeof ROLE_CONFIG;
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.LOAN_OFFICER;
  const isOfficer = role === 'LOAN_OFFICER' || role === 'SUPER_ADMIN';
  const isAnalyst = role === 'CREDIT_ANALYST' || role === 'SUPER_ADMIN';
  const isApprover = role === 'APPROVER' || role === 'SUPER_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const currentStageIndex = STAGE_ORDER[app.status] ?? -1;
  const isRejected = app.status === 'REJECTED';
  const combinedTimeline = getCombinedTimeline();

  // ─── Sub-Components ────────────────────────────────────────────────────────

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleString('en-IN', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleString('en-IN', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getAssigneeInfo = () => {
    if (app.assessment?.assessedBy) {
      return {
        name: `${app.assessment.assessedBy.firstName} ${app.assessment.assessedBy.lastName}`,
        role: 'Credit Analyst',
      };
    }
    const reviewEvent = app.statusHistory.find((h) => h.newStatus === 'UNDER_REVIEW');
    if (reviewEvent) {
      return {
        name: `${reviewEvent.changedBy.firstName} ${reviewEvent.changedBy.lastName}`,
        role: 'Credit Analyst',
      };
    }
    const submitEvent = app.statusHistory.find((h) => h.newStatus === 'SUBMITTED');
    if (submitEvent) {
      return {
        name: `${submitEvent.changedBy.firstName} ${submitEvent.changedBy.lastName}`,
        role: 'Credit Analyst',
      };
    }
    const draftEvent = app.statusHistory.find((h) => h.newStatus === 'DRAFT' || h.oldStatus === null);
    if (draftEvent) {
      return {
        name: `${draftEvent.changedBy.firstName} ${draftEvent.changedBy.lastName}`,
        role: 'Loan Officer',
      };
    }
    return { name: 'Unassigned', role: 'System' };
  };

  const getLastUpdatedInfo = () => {
    if (app.statusHistory.length > 0) {
      const latest = [...app.statusHistory].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];
      return {
        timeStr: formatDateTime(latest.changedAt),
        by: `${latest.changedBy.firstName} ${latest.changedBy.lastName}`,
      };
    }
    return {
      timeStr: formatDateTime(app.updatedAt),
      by: 'System',
    };
  };

  const getStageDateStr = () => {
    const match = [...app.statusHistory]
      .filter((h) => h.newStatus === app.status)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];
    return match ? formatDateOnly(match.changedAt) : formatDateOnly(app.updatedAt);
  };

  const getStepperNodes = () => {
    const history = [...app.statusHistory].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
    const nodes: { label: string; sub: string; status: 'COMPLETED' | 'CURRENT' | 'PENDING'; isReject?: boolean }[] = [];

    // Always start with Draft
    const hasDraft = history.some(h => h.newStatus === 'DRAFT' || h.oldStatus === null);
    const isCurrentDraft = app.status === 'DRAFT';
    nodes.push({
      label: 'Draft',
      sub: isCurrentDraft ? 'Current Stage' : 'Completed',
      status: isCurrentDraft ? 'CURRENT' : 'COMPLETED',
    });

    if (app.status === 'DRAFT') {
      nodes.push({ label: 'Submitted', sub: 'Pending', status: 'PENDING' });
      nodes.push({ label: 'Review', sub: 'Pending', status: 'PENDING' });
      nodes.push({ label: 'Approved', sub: 'Pending', status: 'PENDING' });
      return nodes;
    }

    // Submitted
    const hasSubmitted = history.some(h => h.newStatus === 'SUBMITTED');
    const isCurrentSubmitted = app.status === 'SUBMITTED';
    nodes.push({
      label: 'Submitted',
      sub: isCurrentSubmitted ? 'Current Stage' : 'Completed',
      status: isCurrentSubmitted ? 'CURRENT' : (hasSubmitted ? 'COMPLETED' : 'PENDING'),
    });

    if (app.status === 'SUBMITTED') {
      nodes.push({ label: 'Review', sub: 'Pending', status: 'PENDING' });
      nodes.push({ label: 'Approved', sub: 'Pending', status: 'PENDING' });
      return nodes;
    }

    // Under Review / Review
    const hasReview = history.some(h => h.newStatus === 'UNDER_REVIEW');
    const isCurrentReview = app.status === 'UNDER_REVIEW';
    nodes.push({
      label: 'Review',
      sub: isCurrentReview ? 'Current Stage' : 'Completed',
      status: isCurrentReview ? 'CURRENT' : (hasReview ? 'COMPLETED' : 'PENDING'),
    });

    if (app.status === 'UNDER_REVIEW') {
      nodes.push({ label: 'Approved', sub: 'Pending', status: 'PENDING' });
      return nodes;
    }

    if (app.status === 'REJECTED') {
      nodes.push({
        label: 'Rejected',
        sub: 'Current Stage',
        status: 'CURRENT',
        isReject: true,
      });
      return nodes;
    }

    // Approved
    const hasApproved = history.some(h => h.newStatus === 'APPROVED');
    const isCurrentApproved = app.status === 'APPROVED';
    nodes.push({
      label: 'Approved',
      sub: isCurrentApproved ? 'Current Stage' : 'Completed',
      status: isCurrentApproved ? 'CURRENT' : (hasApproved ? 'COMPLETED' : 'PENDING'),
    });

    if (app.status === 'APPROVED') {
      nodes.push({ label: 'Offer Sent', sub: 'Pending', status: 'PENDING' });
      nodes.push({ label: 'Accepted', sub: 'Pending', status: 'PENDING' });
      nodes.push({ label: 'Funded', sub: 'Pending', status: 'PENDING' });
      return nodes;
    }

    // Offer Generated
    const hasOffer = history.some(h => h.newStatus === 'OFFER_GENERATED');
    const isCurrentOffer = app.status === 'OFFER_GENERATED';
    nodes.push({
      label: 'Offer Sent',
      sub: isCurrentOffer ? 'Current Stage' : 'Completed',
      status: isCurrentOffer ? 'CURRENT' : (hasOffer ? 'COMPLETED' : 'PENDING'),
    });

    if (app.status === 'OFFER_GENERATED') {
      nodes.push({ label: 'Accepted', sub: 'Pending', status: 'PENDING' });
      nodes.push({ label: 'Funded', sub: 'Pending', status: 'PENDING' });
      return nodes;
    }

    // Offer Accepted
    const hasAccepted = history.some(h => h.newStatus === 'OFFER_ACCEPTED');
    const isCurrentAccepted = app.status === 'OFFER_ACCEPTED';
    nodes.push({
      label: 'Accepted',
      sub: isCurrentAccepted ? 'Current Stage' : 'Completed',
      status: isCurrentAccepted ? 'CURRENT' : (hasAccepted ? 'COMPLETED' : 'PENDING'),
    });

    if (app.status === 'OFFER_ACCEPTED') {
      nodes.push({ label: 'Funded', sub: 'Pending', status: 'PENDING' });
      return nodes;
    }

    // Disbursed (Funded)
    const isCurrentDisbursed = app.status === 'DISBURSED';
    nodes.push({
      label: 'Funded',
      sub: isCurrentDisbursed ? 'Current Stage' : 'Completed',
      status: isCurrentDisbursed ? 'CURRENT' : 'PENDING',
    });

    return nodes;
  };

  // ── Workflow Pipeline Stepper ─────────────────────────────────────────────
  const renderWorkflowStepper = () => {
    const stepperNodes = getStepperNodes();
    return (
      <div className="w-full bg-card border border-border rounded-xl px-6 py-4 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] px-4">
          {stepperNodes.map((node, idx) => {
            const isCompleted = node.status === 'COMPLETED';
            const isCurrent = node.status === 'CURRENT';
            const isPending = node.status === 'PENDING';
            const isLast = idx === stepperNodes.length - 1;

            return (
              <React.Fragment key={node.label}>
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isCurrent ? (node.isReject ? 'bg-rose-500 text-white ring-2 ring-rose-500/25 animate-pulse' : 'bg-primary text-white ring-2 ring-primary/25') :
                    'bg-muted border-2 border-border text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4.5 w-4.5" weight="bold" />
                    ) : isCurrent ? (
                      node.isReject ? (
                        <XCircle className="h-4.5 w-4.5" weight="fill" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )
                    ) : (
                      <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-[10px] font-extrabold uppercase tracking-wide leading-none ${
                      isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                      isCurrent ? (node.isReject ? 'text-rose-650' : 'text-primary') :
                      'text-muted-foreground'
                    }`}>{node.label}</p>
                    <span className="text-[9px] font-semibold text-muted-foreground/75 leading-none block mt-0.5">{node.sub}</span>
                  </div>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-0.5 border-t-2 border-dotted mx-2 -mt-7 transition-all ${
                    isCompleted ? 'border-emerald-500/50' :
                    isCurrent ? 'border-primary/50' :
                    'border-border'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Page Header ────────────────────────────────────────────────────────────
  const renderPageHeader = () => {
    const assignee = getAssigneeInfo();
    const lastUpdate = getLastUpdatedInfo();
    const stageDate = getStageDateStr();

    // Color mapper for current stage quick badge/dot
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
  };

  // ── Applicant Profile Card ─────────────────────────────────────────────────
  const renderApplicantProfileCard = () => (
    <Card className="border-border bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/10 border-b border-border py-3.5 px-5">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <User className="h-4 w-4 text-primary" weight="bold" />
          Applicant Profile
        </CardTitle>
        <CardDescription className="text-[10px] font-semibold text-muted-foreground mt-0.5">Personal and financial credit details.</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
          {/* Name */}
          <div className="col-span-2 sm:col-span-1 text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Full Name</p>
            <p className="font-bold text-foreground text-sm capitalize">{app.applicantName}</p>
          </div>
          {/* Email */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address</p>
            <div className="flex items-center gap-1.5">
              <Envelope className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="font-semibold text-foreground truncate">{app.email}</p>
            </div>
          </div>
          {/* Phone */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Phone Number</p>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="font-semibold font-mono text-foreground">{app.phone}</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-3 border-t border-border" />

          {/* PAN */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">PAN Card</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-widest text-xs bg-muted border border-border px-2 py-0.5 rounded text-foreground">
                {app.pan}
              </span>
              <span className="text-[9px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                {role === 'SUPER_ADMIN' || role === 'LOAN_OFFICER' ? 'Full' : 'Masked'}
              </span>
            </div>
          </div>
          {/* Loan Type */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Loan Category</p>
            <p className="font-bold text-primary text-sm">{app.loanType}</p>
          </div>
          {/* Employment */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Employment</p>
            <div className="flex items-center gap-1.5">
              <Buildings className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="font-bold text-foreground">{app.employmentType}</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-3 border-t border-border" />

          {/* Loan Amount */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Requested Amount</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(app.loanAmount)}</p>
          </div>
          {/* Monthly Income */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Monthly Income</p>
            <div className="flex items-center gap-1.5">
              <TrendUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-lg font-extrabold text-foreground">{formatCurrency(app.monthlyIncome)}</p>
            </div>
          </div>
          {/* DTI Ratio */}
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Loan-to-Income</p>
            <p className="font-bold text-foreground text-sm">
              {((app.loanAmount / (app.monthlyIncome * 12)) * 100).toFixed(1)}%
              <span className="text-[10px] text-muted-foreground font-normal ml-1">(annual)</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ── Documents Card ─────────────────────────────────────────────────────────
  const renderDocumentsCard = () => {
    const canUpload = app.status === 'DRAFT' && isOfficer;
    const canVerify = app.status === 'UNDER_REVIEW' && isAnalyst;

    return (
      <Card className="border-border bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border py-3.5 px-5 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4 text-primary" weight="bold" />
              Verification Documents
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {app.documents.length} document{app.documents.length !== 1 ? 's' : ''} attached
            </CardDescription>
          </div>
          {/* Upload section inline for non-draft — hidden */}
        </CardHeader>

        {/* Drag & drop upload zone — only for LOAN_OFFICER in DRAFT */}
        {canUpload && (
          <div className="border-b border-border px-5 pt-4 pb-4 space-y-3 bg-muted/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="docType" className="text-xs font-bold text-foreground">Document Type</Label>
                <Select value={selectedDocType} onValueChange={(v) => { if (v) setSelectedDocType(v as any); }} disabled={uploadLoading}>
                  <SelectTrigger id="docType" className="h-9 text-xs border-border bg-background rounded-lg font-semibold">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-foreground">
                    <SelectItem value="PAN">PAN Card</SelectItem>
                    <SelectItem value="AADHAAR">Aadhaar Card</SelectItem>
                    <SelectItem value="SALARY_SLIP">Salary Slip</SelectItem>
                    <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div
                className={`sm:col-span-2 relative flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/5 hover:border-primary/50 hover:bg-muted/20'} ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              >
                <Input id="file-upload-input" type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; } setSelectedFile(f); } }}
                  disabled={uploadLoading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.jpg,.jpeg,.png" />
                <div className="p-1.5 bg-muted rounded text-muted-foreground border border-border/50 shrink-0">
                  <UploadSimple className="h-3.5 w-3.5" weight="bold" />
                </div>
                <div className="min-w-0 text-left pointer-events-none">
                  {selectedFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">{selectedFile.name}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); const fi = document.getElementById('file-upload-input') as HTMLInputElement; if (fi) fi.value = ''; }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground"><span className="text-primary font-bold">Click to upload</span> or drag PDF/JPG/PNG</span>
                  )}
                </div>
              </div>
            </div>
            {uploadLoading && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <Button onClick={handleDocumentUpload} disabled={uploadLoading || !selectedFile}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 rounded-lg cursor-pointer text-xs gap-1.5 flex items-center justify-center">
              {uploadLoading ? <><ArrowsCounterClockwise className="h-3.5 w-3.5 animate-spin" /> Uploading...</> : <><UploadSimple className="h-3.5 w-3.5" weight="bold" /> Upload Document</>}
            </Button>
          </div>
        )}

        <CardContent className="p-5 space-y-2.5">
          {app.documents.length === 0 ? (
            <div className="p-8 text-center bg-muted/10 rounded-xl border border-dashed border-border flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground font-semibold">No documents uploaded yet.</p>
            </div>
          ) : (
            app.documents.map((doc) => (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-primary/10 p-2 rounded shrink-0">
                    <FileText className="h-3.5 w-3.5 text-primary" weight="bold" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-bold text-xs truncate text-foreground">{doc.originalName || doc.publicId}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{doc.documentType} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status badge */}
                  {doc.status === 'VERIFIED' && <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 uppercase">Verified</span>}
                  {doc.status === 'REJECTED' && <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 uppercase">Rejected</span>}
                  {doc.status === 'PENDING' && <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 uppercase">Pending</span>}

                  {/* View button */}
                  {doc.secureUrl && (
                    <Button size="sm" variant="outline" onClick={() => { setPreviewUrl(doc.secureUrl); setPreviewTitle(doc.originalName); }}
                      className="h-7 text-[10px] border-border cursor-pointer font-bold rounded-lg gap-1 px-2.5">
                      <Eye className="h-3 w-3" /> View
                    </Button>
                  )}

                  {/* Analyst: Verify / Reject */}
                  {canVerify && doc.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                        className="h-7 text-[10px] border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 cursor-pointer font-bold rounded-lg px-2.5">
                        <CheckSquare className="h-3 w-3 mr-1" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                        className="h-7 text-[10px] border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 cursor-pointer font-bold rounded-lg px-2.5">
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </>
                  )}

                  {/* Officer: Delete (DRAFT only) */}
                  {app.status === 'DRAFT' && isOfficer && (
                    <Button size="sm" variant="outline" onClick={() => handleDeleteDocument(doc.publicId)}
                      className="h-7 w-7 p-0 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 cursor-pointer rounded-lg">
                      <Trash className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Audit Timeline Card ────────────────────────────────────────────────────
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

  const renderTimelineCard = () => (
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

  // ── Assessment Score Card (read-only display) ──────────────────────────────
  const renderLockedAssessmentCard = () => {
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
  };

  // ── Offer Display Card (read-only) ─────────────────────────────────────────
  const renderOfferCard = () => {
    if (!app.offer) return null;
    return (
      <Card className="border-border bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/20 py-3.5 px-5 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Percent className="h-4 w-4" weight="bold" />
              Loan Offer Terms
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-primary/70 mt-0.5">Issued terms sent to customer.</CardDescription>
          </div>
          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${app.offer.offerStatus === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : app.offer.offerStatus === 'DECLINED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
            {app.offer.offerStatus}
          </span>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/10 border border-border p-3 rounded-lg text-left">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Interest Rate</span>
              <p className="font-extrabold text-foreground mt-1 text-base">{app.offer.interestRate}<span className="text-xs font-semibold text-muted-foreground ml-0.5">% p.a.</span></p>
            </div>
            <div className="bg-muted/10 border border-border p-3 rounded-lg text-left">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Tenure</span>
              <p className="font-extrabold text-foreground mt-1 text-base">{app.offer.tenureMonths}<span className="text-xs font-semibold text-muted-foreground ml-0.5"> months</span></p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-center">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Monthly EMI</span>
            <p className="text-2xl font-extrabold text-primary mt-1">{formatCurrency(app.offer.emiAmount)}</p>
            <p className="text-[10px] text-primary/70 font-semibold mt-0.5">Total repayment: {formatCurrency(app.offer.emiAmount * app.offer.tenureMonths)}</p>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono border-t border-border pt-2.5 flex justify-between">
            <span>Issued: {new Date(app.offer.generatedAt).toLocaleDateString('en-IN')}</span>
            <span>Expires: {new Date(app.offer.expiresAt).toLocaleDateString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Disbursement Card ──────────────────────────────────────────────────────
  const renderDisbursementCard = () => {
    if (!app.disbursement) return null;
    return (
      <Card className="border-violet-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-violet-500/5 border-b border-violet-500/20 py-3.5 px-5 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Confetti className="h-4 w-4" weight="bold" />
              Disbursement Cleared
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-violet-600/70 dark:text-violet-400/70 mt-0.5">Funds successfully dispatched.</CardDescription>
          </div>
          <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase">{app.disbursement.status}</span>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs font-semibold">
          <div className="flex justify-between border-b border-border pb-2.5">
            <span className="text-muted-foreground">Disbursed Amount</span>
            <span className="font-extrabold text-foreground text-base">{formatCurrency(app.disbursement.amount)}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2.5 items-center">
            <span className="text-muted-foreground">Transaction Ref.</span>
            <span className="font-mono text-primary font-bold bg-muted px-2 py-0.5 border border-border rounded text-[11px] select-text">{app.disbursement.referenceNumber}</span>
          </div>
          <div className="flex justify-between pb-0.5">
            <span className="text-muted-foreground">Cleared On</span>
            <span className="font-bold text-foreground">{new Date(app.disbursement.disbursedAt).toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE-SPECIFIC WORKSPACES
  // ══════════════════════════════════════════════════════════════════════════

  // ── LOAN OFFICER Workspace ─────────────────────────────────────────────────
  const renderLoanOfficerWorkspace = () => {
    // Waiting states
    if (app.status === 'SUBMITTED') {
      return (
        <Card className="border-blue-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-500/5 border-b border-blue-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Hourglass className="h-4 w-4 animate-pulse" weight="fill" />
              Awaiting Credit Review
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-center space-y-3">
            <div className="py-4 space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <MagnifyingGlass className="h-5 w-5 text-primary" weight="bold" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">Application submitted and pending Credit Analyst review.</p>
              <p className="text-[10px] text-muted-foreground font-mono">Next step: Credit analyst starts UNDER_REVIEW</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (app.status === 'UNDER_REVIEW') {
      return (
        <Card className="border-amber-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Pulse className="h-4 w-4 animate-pulse" weight="bold" />
              Credit Underwriting In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-xs font-semibold text-muted-foreground py-3">
              Application is currently being assessed by the Credit Analysis team. You will be notified once the review is completed.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (app.status === 'APPROVED') {
      return (
        <Card className="border-emerald-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" weight="fill" />
              Loan Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground py-3">Approved by the underwriting team. Awaiting offer generation by Approver.</p>
          </CardContent>
        </Card>
      );
    }

    // OFFER_GENERATED — Officer records customer acceptance/decline
    if (app.status === 'OFFER_GENERATED' && app.offer) {
      return (
        <Card className="border-purple-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-purple-500/5 border-b border-purple-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Sparkle className="h-4 w-4 animate-pulse" weight="fill" />
              Customer Response Required
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-purple-600/70 dark:text-purple-400/70 mt-0.5">
              Record the customer&apos;s decision on the offer.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="bg-muted/10 border border-border rounded-lg p-3 text-xs text-left space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Offer Amount</span><span className="font-bold text-foreground">{formatCurrency(app.offer.loanAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly EMI</span><span className="font-bold text-primary">{formatCurrency(app.offer.emiAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span className="font-bold text-foreground">{new Date(app.offer.expiresAt).toLocaleDateString('en-IN')}</span></div>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold text-center">
              Note: Customer acceptance/decline is handled by the customer portal. Contact the customer to confirm their decision.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (app.status === 'OFFER_ACCEPTED') {
      return (
        <Card className="border-emerald-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <SealCheck className="h-4 w-4" weight="fill" />
              Offer Accepted
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground py-3">Customer has accepted the offer. Awaiting disbursement authorization by the Approver.</p>
          </CardContent>
        </Card>
      );
    }

    if (app.status === 'DISBURSED') {
      return (
        <Card className="border-violet-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-violet-500/5 border-b border-violet-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Confetti className="h-4 w-4" weight="fill" />
              Case Closed — Funds Disbursed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground py-3">Loan fully processed. Funds have been disbursed successfully.</p>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // ── CREDIT ANALYST Workspace ───────────────────────────────────────────────
  const renderCreditAnalystWorkspace = () => {
    if (app.status === 'SUBMITTED') {
      return (
        <Card className="border-amber-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <MagnifyingGlass className="h-4 w-4" weight="bold" />
              Ready for Credit Review
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-0.5">
              Start underwriting assessment for this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="bg-muted/10 border border-border rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Applicant</span><span className="font-bold text-foreground capitalize">{app.applicantName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-bold text-foreground">{formatCurrency(app.loanAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Income</span><span className="font-bold text-foreground">{formatCurrency(app.monthlyIncome)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span className="font-bold text-foreground">{app.documents.length} uploaded</span></div>
            </div>
            <Button onClick={() => handleStatusTransition('UNDER_REVIEW')} disabled={actionLoading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold h-10 rounded-lg cursor-pointer text-xs gap-1.5 flex items-center justify-center">
              <MagnifyingGlass className="h-4 w-4" weight="bold" />
              {actionLoading ? 'Starting Review...' : 'Begin Credit Assessment'}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (app.status === 'UNDER_REVIEW') {
      // Assessment already done
      if (app.assessment?.status === 'COMPLETED') {
        return (
          <div className="space-y-4">
            {renderLockedAssessmentCard()}
            <Card className="border-border bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground py-2">
                  <Hourglass className="h-4 w-4 animate-pulse" weight="fill" />
                  Awaiting Approver decision
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Assessment wizard
      return (
        <Card className="border-amber-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Pulse className="h-4 w-4 animate-pulse" weight="bold" />
              Underwriting Assessment
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-0.5">
              Step {assessmentStep + 1} of 2 — {assessmentStep === 0 ? 'Enter decision notes' : 'Review & lock assessment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <AnimatePresence mode="wait">
              {assessmentStep === 0 ? (
                <motion.div key="step0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                  {/* Applicant financial snapshot */}
                  <div className="bg-muted/10 border border-border rounded-lg p-3 text-xs space-y-2">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground font-semibold">Monthly Income</span>
                      <span className="font-extrabold text-foreground">{formatCurrency(app.monthlyIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Loan-to-Income</span>
                      <span className={`font-bold ${app.loanAmount / (app.monthlyIncome * 12) > 0.5 ? 'text-rose-600' : app.loanAmount / (app.monthlyIncome * 12) > 0.3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {((app.loanAmount / (app.monthlyIncome * 12)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="notes" className="text-xs font-bold text-foreground">Decision Analysis Notes <span className="text-rose-500">*</span></Label>
                    <textarea id="notes" rows={4}
                      placeholder="Enter analytical findings, risk arguments, income verification notes, credit history observations..."
                      value={assessmentNotes} onChange={(e) => setAssessmentNotes(e.target.value)}
                      className="w-full p-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y font-semibold" />
                  </div>
                  <Button onClick={handleRunAssessment} disabled={!assessmentNotes.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold h-10 rounded-lg cursor-pointer text-xs gap-1.5 flex items-center justify-center disabled:opacity-50">
                    <Calculator className="h-4 w-4" />
                    Run Credit Scoring Engine
                  </Button>
                </motion.div>
              ) : (
                previewAssessment && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Credit Score</span>
                        <span className="font-extrabold text-foreground text-sm">{previewAssessment.creditScore} / 900</span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${previewAssessment.riskLevel === 'LOW' ? 'bg-emerald-500' : previewAssessment.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min((previewAssessment.creditScore / 900) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-muted/10 border border-border p-2.5 rounded-lg text-left">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Risk Level</span>
                        <p className={`font-extrabold mt-1 uppercase ${previewAssessment.riskLevel === 'LOW' ? 'text-emerald-600' : previewAssessment.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-rose-600'}`}>
                          {previewAssessment.riskLevel}
                        </p>
                      </div>
                      <div className="bg-muted/10 border border-border p-2.5 rounded-lg text-left">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Recommendation</span>
                        <p className="font-bold mt-1 text-foreground text-xs">{previewAssessment.recommendation}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setAssessmentStep(0)} disabled={saveLoading}
                        className="flex-1 border-border bg-card text-foreground hover:bg-muted font-semibold h-9 rounded-lg cursor-pointer text-xs">
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                      </Button>
                      <Button onClick={handleSaveAssessment} disabled={saveLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-9 rounded-lg cursor-pointer text-xs gap-1">
                        <Lock className="h-3.5 w-3.5" weight="fill" />
                        {saveLoading ? 'Locking...' : 'Lock Report'}
                      </Button>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      );
    }

    // Post-review — show read-only locked report if available
    if (['APPROVED', 'OFFER_GENERATED', 'OFFER_ACCEPTED', 'DISBURSED', 'REJECTED'].includes(app.status)) {
      return (
        <div className="space-y-4">
          {app.assessment?.status === 'COMPLETED' && renderLockedAssessmentCard()}
        </div>
      );
    }

    return null;
  };

  // ── APPROVER Workspace ─────────────────────────────────────────────────────
  const renderApproverWorkspace = () => (
    <div className="space-y-4">
      {/* Show locked assessment if available */}
      {app.assessment && renderLockedAssessmentCard()}

      {/* Offer generator — APPROVED status, no offer yet */}
      {app.status === 'APPROVED' && !app.offer && (
        <Card className="border-emerald-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Percent className="h-4 w-4" weight="bold" />
              Configure Loan Offer
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              Step {offerStep + 1} of 2 — {offerStep === 0 ? 'Define terms' : 'Preview EMI & confirm'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleGenerateOffer}>
              <AnimatePresence mode="wait">
                {offerStep === 0 ? (
                  <motion.div key="offer0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1.5">
                        <Label htmlFor="interestRate" className="text-xs font-bold text-foreground">Interest Rate <span className="text-muted-foreground font-normal">(% p.a.)</span></Label>
                        <Input id="interestRate" type="number" step="0.01" min="1" max="50"
                          value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                          className="bg-background border-border focus-visible:ring-emerald-500 text-foreground h-9 font-bold text-xs rounded-lg" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="tenureMonths" className="text-xs font-bold text-foreground">Tenure <span className="text-muted-foreground font-normal">(months)</span></Label>
                        <Input id="tenureMonths" type="number" min="1" max="360"
                          value={tenureMonths} onChange={(e) => setTenureMonths(parseInt(e.target.value) || 0)}
                          className="bg-background border-border focus-visible:ring-emerald-500 text-foreground h-9 font-bold text-xs rounded-lg" />
                      </div>
                    </div>
                    <Button type="button" onClick={() => { if (interestRate > 0 && tenureMonths > 0) setOfferStep(1); else toast.error('Rate and tenure must be positive.'); }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 rounded-lg cursor-pointer text-xs gap-1.5 flex items-center justify-center">
                      Calculate EMI <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="offer1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* EMI preview */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Monthly EMI</span>
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(calculatedEmi)}</p>
                    </div>
                    <div className="bg-muted/10 border border-border rounded-lg p-3 text-xs space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Principal</span><span className="font-bold text-foreground">{formatCurrency(app.loanAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Interest @ {interestRate}% p.a.</span><span className="font-bold text-foreground">{tenureMonths} months</span></div>
                      <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground font-semibold">Total Repayment</span><span className="font-extrabold text-foreground">{formatCurrency(calculatedTotalRepayment)}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" type="button" onClick={() => setOfferStep(0)} disabled={offerLoading}
                        className="flex-1 border-border bg-card text-foreground hover:bg-muted font-semibold h-9 rounded-lg cursor-pointer text-xs">
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                      </Button>
                      <Button type="submit" disabled={offerLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-9 rounded-lg cursor-pointer text-xs gap-1">
                        <PaperPlaneTilt className="h-3.5 w-3.5" weight="bold" />
                        {offerLoading ? 'Generating...' : 'Generate Offer'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Offer display */}
      {app.offer && !app.disbursement && renderOfferCard()}

      {/* Disburse button */}
      {app.status === 'OFFER_ACCEPTED' && !app.disbursement && (
        <Card className="border-violet-500/20 bg-card text-foreground shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-violet-500/5 border-b border-violet-500/20 py-3.5 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <CurrencyInr className="h-4 w-4" weight="bold" />
              Authorize Disbursement
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-violet-600/70 dark:text-violet-400/70 mt-0.5">Customer has accepted the offer. Release funds now.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="bg-muted/10 border border-border rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Amount to Disburse</span><span className="font-extrabold text-foreground text-base">{formatCurrency(app.loanAmount)}</span></div>
              {app.offer && <div className="flex justify-between"><span className="text-muted-foreground font-semibold">Monthly EMI</span><span className="font-bold text-primary">{formatCurrency(app.offer.emiAmount)}</span></div>}
            </div>
            <Button onClick={handleDisburseLoan} disabled={disburseLoading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 rounded-lg cursor-pointer shadow flex items-center justify-center gap-1.5 text-xs">
              <CurrencyInr className="h-4.5 w-4.5" weight="bold" />
              {disburseLoading ? 'Executing Transfer...' : 'Authorize Fund Release'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disbursement record */}
      {app.disbursement && renderDisbursementCard()}
    </div>
  );

  // ── SUPER_ADMIN Workspace ──────────────────────────────────────────────────
  const renderSuperAdminWorkspace = () => (
    <div className="space-y-4">
      {/* Admin pill indicator */}
      <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide w-full">
        <Star className="h-3 w-3" weight="fill" />
        Super Admin — All Actions Available
      </div>

      {/* Sequential workspaces */}
      {renderLoanOfficerWorkspace()}
      {renderCreditAnalystWorkspace()}
      {app.status !== 'DRAFT' && app.status !== 'SUBMITTED' && renderApproverWorkspace()}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-6 pb-10">
      {/* Page Header */}
      {renderPageHeader()}

      {/* Workflow Pipeline Stepper */}
      {renderWorkflowStepper()}

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* LEFT COLUMN — Applicant Profile + Documents */}
        <div className="lg:col-span-2 space-y-6">
          {renderApplicantProfileCard()}
          {renderDocumentsCard()}
        </div>

        {/* RIGHT COLUMN — Timeline + Role Workspace */}
        <div className="space-y-6">
          {renderTimelineCard()}
          {/* Dynamic Action Process Status Card */}
          {(() => {
            const assignee = getAssigneeInfo();
            const lastUpdate = getLastUpdatedInfo();

            const config: Record<string, {
              borderClass: string;
              lineClass: string;
              iconBgClass: string;
              iconColorClass: string;
              icon: React.ReactNode;
              title: string;
              subtitle: string;
              badgeClass: string;
              badgeLabel: string;
              noticeBgClass: string;
              noticeTextClass: string;
              noticeIcon: React.ReactNode;
              noticeMsg: string;
            }> = {
              DRAFT: {
                borderClass: 'border-slate-500/25 dark:border-slate-500/20',
                lineClass: 'bg-slate-400',
                iconBgClass: 'bg-slate-500/10',
                iconColorClass: 'text-slate-500',
                icon: <FileText className="h-5 w-5" weight="fill" />,
                title: 'Draft Preparation',
                subtitle: 'Awaiting completion by Loan Officer.',
                badgeClass: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
                badgeLabel: 'Draft Mode',
                noticeBgClass: 'bg-slate-500/5 border-slate-500/15',
                noticeTextClass: 'text-slate-650',
                noticeIcon: <Warning className="h-3.5 w-3.5 text-slate-500" weight="fill" />,
                noticeMsg: 'Please verify all applicant details, upload the required documentation (PAN, Aadhaar), and submit the case for credit review.',
              },
              SUBMITTED: {
                borderClass: 'border-blue-500/25 dark:border-blue-500/20',
                lineClass: 'bg-blue-500',
                iconBgClass: 'bg-blue-500/10',
                iconColorClass: 'text-blue-500',
                icon: <PaperPlaneTilt className="h-5 w-5" weight="fill" />,
                title: 'Awaiting Credit Allocation',
                subtitle: 'Pending Credit Analyst assignment.',
                badgeClass: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
                badgeLabel: 'Submitted',
                noticeBgClass: 'bg-blue-500/5 border-blue-500/15',
                noticeTextClass: 'text-blue-650',
                noticeIcon: <Pulse className="h-3.5 w-3.5 text-blue-500" weight="bold" />,
                noticeMsg: 'The file has been queued for credit team underwriting. An analyst will claim this case to begin document verification.',
              },
              UNDER_REVIEW: {
                borderClass: 'border-amber-500/25 dark:border-amber-500/20',
                lineClass: 'bg-amber-500',
                iconBgClass: 'bg-amber-500/10',
                iconColorClass: 'text-amber-500',
                icon: <MagnifyingGlass className="h-5 w-5" weight="fill" />,
                title: 'Under Credit Review',
                subtitle: 'Credit assessment and underwriting in progress.',
                badgeClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
                badgeLabel: 'Reviewing',
                noticeBgClass: 'bg-amber-500/5 border-amber-500/15',
                noticeTextClass: 'text-amber-650',
                noticeIcon: <Hourglass className="h-3.5 w-3.5 text-amber-500" weight="fill" />,
                noticeMsg: 'The assigned credit analyst is performing risk rating checks. The report must be locked before final approval decision.',
              },
              APPROVED: {
                borderClass: 'border-emerald-500/25 dark:border-emerald-500/20',
                lineClass: 'bg-emerald-500',
                iconBgClass: 'bg-emerald-500/10',
                iconColorClass: 'text-emerald-500',
                icon: <SealCheck className="h-5 w-5" weight="fill" />,
                title: 'Underwriting Approved',
                subtitle: 'Credit approved. Offer terms required.',
                badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                badgeLabel: 'Approved',
                noticeBgClass: 'bg-emerald-500/5 border-emerald-500/15',
                noticeTextClass: 'text-emerald-650',
                noticeIcon: <Percent className="h-3.5 w-3.5 text-emerald-500" weight="bold" />,
                noticeMsg: 'Underwriter review cleared. Approver must configure interest rates and tenure terms to issue the lending offer.',
              },
              OFFER_GENERATED: {
                borderClass: 'border-purple-500/25 dark:border-purple-500/20',
                lineClass: 'bg-purple-500',
                iconBgClass: 'bg-purple-500/10',
                iconColorClass: 'text-purple-500',
                icon: <Percent className="h-5 w-5" weight="fill" />,
                title: 'Lending Terms Issued',
                subtitle: 'Sent to client for acceptance.',
                badgeClass: 'bg-purple-500/10 text-purple-650 border border-purple-500/20',
                badgeLabel: 'Offer Sent',
                noticeBgClass: 'bg-purple-500/5 border-purple-500/15',
                noticeTextClass: 'text-purple-650',
                noticeIcon: <Clock className="h-3.5 w-3.5 text-purple-500" weight="bold" />,
                noticeMsg: 'Awaiting customer response on lending terms. The case will auto-expire if not accepted by the customer portal expiry date.',
              },
              OFFER_ACCEPTED: {
                borderClass: 'border-emerald-500/25 dark:border-emerald-500/20',
                lineClass: 'bg-emerald-500',
                iconBgClass: 'bg-emerald-500/10',
                iconColorClass: 'text-emerald-500',
                icon: <CheckCircle className="h-5 w-5" weight="fill" />,
                title: 'Lending Terms Accepted',
                subtitle: 'Customer accepted contract agreement.',
                badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                badgeLabel: 'Accepted',
                noticeBgClass: 'bg-emerald-500/5 border-emerald-500/15',
                noticeTextClass: 'text-emerald-650',
                noticeIcon: <CurrencyInr className="h-3.5 w-3.5 text-emerald-500" weight="bold" />,
                noticeMsg: 'Client signed lending agreement. Payout release must be authorized by an Approver to close the case.',
              },
              DISBURSED: {
                borderClass: 'border-violet-500/25 dark:border-violet-500/20',
                lineClass: 'bg-violet-500',
                iconBgClass: 'bg-violet-500/10',
                iconColorClass: 'text-violet-500',
                icon: <Confetti className="h-5 w-5" weight="fill" />,
                title: 'Loan Disbursed Cleared',
                subtitle: 'Lending lifecycle completed successfully.',
                badgeClass: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
                badgeLabel: 'Completed',
                noticeBgClass: 'bg-violet-500/5 border-violet-500/15',
                noticeTextClass: 'text-violet-650',
                noticeIcon: <CheckCircle className="h-3.5 w-3.5 text-violet-500" weight="fill" />,
                noticeMsg: 'Lending pipeline successfully completed. Repayment collections will trigger automatically on schedule.',
              },
              REJECTED: {
                borderClass: 'border-rose-500/25 dark:border-rose-500/20',
                lineClass: 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400',
                iconBgClass: 'bg-rose-500/10',
                iconColorClass: 'text-rose-600 dark:text-rose-400',
                icon: <XCircle className="h-5 w-5" weight="fill" />,
                title: 'Application Rejected',
                subtitle: 'This case has been closed.',
                badgeClass: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
                badgeLabel: 'Rejected',
                noticeBgClass: 'bg-rose-500/5 border-rose-500/15',
                noticeTextClass: 'text-rose-650',
                noticeIcon: <Warning className="h-3.5 w-3.5 text-rose-500" weight="fill" />,
                noticeMsg: 'This application cannot be reactivated. The applicant may submit a new application.',
              },
            };

            const cfg = config[app.status] || config.DRAFT;

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`bg-card text-foreground shadow-sm rounded-xl overflow-hidden border ${cfg.borderClass}`}>
                  {/* Top accent line */}
                  <div className={`h-1 w-full ${cfg.lineClass}`} />

                  <CardContent className="p-5 space-y-4">
                    {/* Icon + headline */}
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center h-10 w-10 rounded-xl border border-border/50 shrink-0 ${cfg.iconBgClass} ${cfg.iconColorClass}`}>
                        {cfg.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-extrabold text-foreground leading-tight">{cfg.title}</h4>
                        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{cfg.subtitle}</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/65" />

                    {/* Detail rows */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Decision</span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${cfg.badgeClass}`}>{cfg.badgeLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Application ID</span>
                        <span className="font-mono font-bold text-foreground text-[11px]">{app.applicationNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Decided by</span>
                        <span className="font-semibold text-foreground text-[11px] capitalize">{assignee.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Decision Date</span>
                        <span className="font-semibold text-foreground text-[11px]">{lastUpdate.timeStr}</span>
                      </div>
                    </div>

                    {/* Notice Block */}
                    <div className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left ${cfg.noticeBgClass}`}>
                      <div className="shrink-0 mt-0.5">
                        {cfg.noticeIcon}
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                        {cfg.noticeMsg}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })()}

          {/* Dynamic role workspace */}
          {!isRejected && (
            <AnimatePresence mode="wait">
              <motion.div key={`workspace-${role}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {role === 'LOAN_OFFICER' && renderLoanOfficerWorkspace()}
                {role === 'CREDIT_ANALYST' && renderCreditAnalystWorkspace()}
                {role === 'APPROVER' && renderApproverWorkspace()}
                {role === 'SUPER_ADMIN' && renderSuperAdminWorkspace()}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Offer card in right sidebar (read-only for officer/analyst after generated) */}
          {(role === 'LOAN_OFFICER' || role === 'CREDIT_ANALYST') && app.offer && (
            renderOfferCard()
          )}

          {/* Disbursement card in right sidebar for officer/analyst */}
          {(role === 'LOAN_OFFICER' || role === 'CREDIT_ANALYST') && app.disbursement && (
            renderDisbursementCard()
          )}
        </div>
      </div>

      {/* PDF / Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-card text-card-foreground border-border rounded-xl shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b shrink-0 bg-background/95 backdrop-blur z-10">
            <DialogTitle className="text-sm font-bold truncate pr-6 text-foreground text-left">{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-muted/20 relative overflow-hidden">
            {previewUrl && (
              previewUrl.toLowerCase().includes('.pdf') ? (
                <PdfViewer url={previewUrl} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} className="absolute inset-0 w-full h-full object-contain border-0 p-4" alt={previewTitle} />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS hack for py-0! */}
      <style jsx global>{`
        .py-0\\! { padding-top: 0px !important; padding-bottom: 0px !important; }
      `}</style>
    </div>
  );
}
