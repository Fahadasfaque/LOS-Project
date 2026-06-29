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
import {
  FileText,
  Clock,
  Warning,
  Users,
  TerminalWindow,
  Pulse,
  CurrencyInr,
  TrendUp,
  ArrowsCounterClockwise,
  Plus,
  ShieldCheck,
  Check,
  X,
  ClockCounterClockwise,
  Shield,
  Percent,
  Eye,
  Trash,
  ArrowLeft,
  User,
  CheckCircle,
  CaretRight,
  Calculator,
  Calendar,
  WarningCircle,
  UploadSimple,
  Briefcase,
  Image as ImageIcon
} from '@phosphor-icons/react';
import { PdfViewer } from '@/components/ui/PdfViewer';
import { toast } from 'sonner';

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

  const handleRunAssessment = () => {
    if (!app) return;
    const income = app.monthlyIncome;
    let creditScore = 620;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
    let recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' = 'REJECT';

    if (income >= 50000) {
      creditScore = 780;
      riskLevel = 'LOW';
      recommendation = 'APPROVE';
    } else if (income >= 30000) {
      creditScore = 700;
      riskLevel = 'MEDIUM';
      recommendation = 'MANUAL_REVIEW';
    } else {
      creditScore = 620;
      riskLevel = 'HIGH';
      recommendation = 'REJECT';
    }

    setPreviewAssessment({ creditScore, riskLevel, recommendation });
    setAssessmentStep(1);
  };

  const handleSaveAssessment = async () => {
    if (!previewAssessment) {
      toast.error('Please run the assessment rule check first.');
      return;
    }
    if (!assessmentNotes.trim()) {
      toast.error('Assessment notes are required.');
      return;
    }
    setSaveLoading(true);
    try {
      const res = await api.post('/assessments', {
        applicationId: id,
        creditScore: previewAssessment.creditScore,
        assessmentNotes,
      });
      if (res.success) {
        toast.success('Assessment completed and locked successfully.');
        setAssessmentNotes('');
        setPreviewAssessment(null);
        await fetchDetails();
      }
    } catch (err: any) {
      console.error(err);
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
      const res = await api.post('/offers/generate', {
        applicationId: id,
        interestRate,
        tenureMonths,
      });
      if (res.success) {
        toast.success('Offer generated successfully.');
        await fetchDetails();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate offer.');
    } finally {
      setOfferLoading(false);
    }
  };

  const handleRecordCustomerAcceptance = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/offers/accept', {
        applicationId: id,
      });
      if (res.success) {
        toast.success('Customer acceptance recorded successfully.');
        await fetchDetails();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to record customer acceptance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburseLoan = async () => {
    setDisburseLoading(true);
    try {
      const res = await api.post('/disbursements', {
        applicationId: id,
      });
      if (res.success) {
        toast.success('Funds disbursed successfully.');
        await fetchDetails();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to execute disbursement.');
    } finally {
      setDisburseLoading(false);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/applications/${id}`);
      if (res.success && res.data) {
        setApp(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusTransition = async (targetStatus: string) => {
    setActionLoading(true);
    try {
      if (targetStatus === 'SUBMITTED') {
        await api.post(`/applications/${id}/submit`, {});
        toast.success('Application submitted successfully.');
      } else {
        await api.put(`/applications/${id}/status`, { status: targetStatus });
        toast.success(`Application transitioned to ${targetStatus}.`);
      }
      await fetchDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update application status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

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
      console.error(err);
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
      toast.success('Document deleted successfully.');
      await fetchDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete document.');
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, JPG, and PNG are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.put(`/documents/${docId}/status`, { status });
      toast.success(`Document marked as ${status.toLowerCase()}.`);
      await fetchDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to verify document.');
    }
  };

  if (loading && !app) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Clock className="h-8 w-8 text-primary animate-spin" />
          <span>Retrieving secure credit application file...</span>
        </div>
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-border rounded text-center space-y-4 shadow-sm transition-colors duration-200 text-card-foreground">
        <Warning className="h-12 w-12 text-destructive mx-auto" weight="fill" />
        <h3 className="text-lg font-bold text-foreground">Error Retrieving Data</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer font-bold">
          Go Back
        </Button>
      </div>
    );
  }

  if (!user) return null;

  if (!app) {
    return (
      <div className="text-center text-muted-foreground mt-10 font-bold">
        Application not found.
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DRAFT':
        return <span className="inline-flex items-center rounded bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground border border-border uppercase font-mono">Draft</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center rounded bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold border border-primary/20 animate-pulse uppercase font-mono">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center rounded bg-amber-500/10 text-amber-600 px-2.5 py-1 text-xs font-bold border border-amber-500/20 uppercase font-mono">Under Review</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-bold border border-emerald-500/20 uppercase font-mono">Approved</span>;
      case 'OFFER_GENERATED':
        return <span className="inline-flex items-center rounded bg-purple-500/10 text-purple-600 px-2.5 py-1 text-xs font-bold border border-purple-500/20 animate-pulse uppercase font-mono">Awaiting Customer Response</span>;
      case 'OFFER_ACCEPTED':
        return <span className="inline-flex items-center rounded bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-bold border border-emerald-500/20 uppercase font-mono">Offer Accepted</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-bold border border-destructive/20 uppercase font-mono">Rejected</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center rounded bg-violet-500/10 text-violet-600 px-2.5 py-1 text-xs font-bold border border-violet-500/20 uppercase font-mono">Disbursed</span>;
      default:
        return <span className="inline-flex items-center rounded bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground border border-border uppercase font-mono">{statusStr}</span>;
    }
  };

  const isRoleAllowedToChangeStatus = user && ['CREDIT_ANALYST', 'APPROVER', 'SUPER_ADMIN'].includes(user.role);
  const isRoleOfficer = user && (user.role === 'LOAN_OFFICER' || user.role === 'SUPER_ADMIN');

  const calculatedEmi = (() => {
    const P = app?.loanAmount || 0;
    const r = interestRate / 12 / 100;
    const n = tenureMonths;
    if (!P || !n) return 0;
    if (r === 0) return P / n;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi * 100) / 100;
  })();

  const calculatedTotalRepayment = calculatedEmi * tenureMonths;

  const getCombinedTimeline = () => {
    if (!app) return [];
    const events: any[] = [];

    app.statusHistory.forEach((hist) => {
      events.push({
        id: `status-${hist.id}`,
        type: 'STATUS_CHANGE',
        title: hist.newStatus === 'DRAFT' ? 'Application Drafted' :
          hist.newStatus === 'SUBMITTED' ? 'Application Submitted' :
            hist.newStatus === 'UNDER_REVIEW' ? 'Under Review Started':
              hist.newStatus === 'APPROVED' ? 'Application Approved' :
                hist.newStatus === 'OFFER_GENERATED' ? 'Lending Offer Generated' :
                  hist.newStatus === 'OFFER_ACCEPTED' ? 'Customer Acceptance Recorded' :
                    hist.newStatus === 'REJECTED' ? 'Application Rejected' :
                      hist.newStatus === 'DISBURSED' ? 'Funds Disbursed' :
                        `Status Changed: ${hist.newStatus}`,
        timestamp: hist.changedAt,
        changedBy: hist.changedBy,
        description: hist.oldStatus
          ? `Workflow status updated from ${hist.oldStatus} to ${hist.newStatus}.`
          : `Application initialized as ${hist.newStatus}.`,
        badgeColor: hist.newStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
          hist.newStatus === 'REJECTED' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
            hist.newStatus === 'DISBURSED' ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20' :
              hist.newStatus === 'OFFER_ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                hist.newStatus === 'OFFER_GENERATED' ? 'bg-primary/10 text-primary border border-primary/20' :
                  'bg-muted text-muted-foreground border border-border'
      });
    });

    if (app.assessment && app.assessment.status === 'COMPLETED') {
      events.push({
        id: `assessment-${app.assessment.id}`,
        type: 'ASSESSMENT_COMPLETED',
        title: 'Credit Underwriting Locked',
        timestamp: app.assessment.assessedAt,
        changedBy: app.assessment.assessedBy,
        description: `Credit Score: ${app.assessment.creditScore} (${app.assessment.riskLevel} Risk). Recommendation: ${app.assessment.recommendation}.`,
        badgeColor: 'bg-muted text-muted-foreground border border-border'
      });
    }

    if (app.offer) {
      events.push({
        id: `offer-gen-${app.offer.id}`,
        type: 'OFFER_GENERATED',
        title: 'Loan Offer Generated',
        timestamp: app.offer.generatedAt,
        changedBy: null,
        description: `Offer details: ${formatCurrency(app.offer.loanAmount)} at ${app.offer.interestRate}% interest, ${app.offer.tenureMonths} months tenure, Monthly EMI: ${formatCurrency(app.offer.emiAmount)}.`,
        badgeColor: 'bg-primary/10 text-primary border border-primary/20'
      });

      if (app.offer.acceptedAt) {
        events.push({
          id: `offer-acc-${app.offer.id}`,
          type: 'CUSTOMER_ACCEPTANCE',
          title: 'Customer Acceptance Recorded',
          timestamp: app.offer.acceptedAt,
          changedBy: null,
          description: `Lending terms accepted by client. Monthly EMI: ${formatCurrency(app.offer.emiAmount)}.`,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        });
      }
    }

    if (app.disbursement) {
      events.push({
        id: `disbursement-${app.disbursement.id}`,
        type: 'LOAN_DISBURSED',
        title: 'Loan Disbursed Successfully',
        timestamp: app.disbursement.disbursedAt,
        changedBy: app.disbursement.disbursedBy,
        description: `Funds released. Transaction Reference: ${app.disbursement.referenceNumber} (${app.disbursement.status})`,
        badgeColor: 'bg-violet-500/10 text-violet-600 border border-violet-500/20'
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const combinedTimeline = getCombinedTimeline();

  // Custom components for roles

  const renderApplicantProfileCard = () => (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-muted/20 border-b border-border pb-4">
        <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
          <Briefcase className="h-5 w-5 text-primary" weight="bold" />
          Applicant Profile
        </CardTitle>
        <CardDescription className="text-xs font-medium">Personal and financial profile details.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Applicant Name</span>
            <p className="font-bold text-foreground mt-0.5 capitalize">{app.applicantName}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">PAN Card Number</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold tracking-wider text-xs bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                {app.pan}
              </span>
              <span className="text-[9px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono font-bold">
                {user?.role === 'SUPER_ADMIN' || user?.role === 'LOAN_OFFICER' ? 'Unmasked' : 'Masked (RBAC)'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Email Address</span>
            <p className="mt-0.5 font-medium text-foreground">{app.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Phone Number</span>
            <p className="mt-0.5 font-semibold font-mono text-foreground">{app.phone}</p>
          </div>
          <div className="col-span-2 border-t border-border my-1"></div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loan Type</span>
            <p className="font-bold text-primary mt-0.5">{app.loanType}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Employment Nature</span>
            <p className="font-bold text-foreground mt-0.5">{app.employmentType}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Requested Amount</span>
            <p className="text-base font-extrabold text-emerald-600 mt-0.5">{formatCurrency(app.loanAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Net Monthly Income</span>
            <p className="text-base font-extrabold text-foreground mt-0.5">{formatCurrency(app.monthlyIncome)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTimelineCard = () => (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-muted/20 border-b border-border pb-4">
        <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
          <ClockCounterClockwise className="h-5 w-5 text-primary" weight="bold" />
          Audit Timeline Log
        </CardTitle>
        <CardDescription className="text-xs font-medium">Lifecycle tracking logs for compliance.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 max-h-[360px] overflow-y-auto pr-2">
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border select-none">
          {combinedTimeline.map((evt, idx) => {
            const isNewest = idx === 0;
            return (
              <div key={evt.id || idx} className="relative text-xs">
                <span className={`absolute left-[-20px] top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center border ${isNewest
                    ? 'bg-primary border-primary ring-2 ring-primary/20'
                    : 'bg-card border-muted-foreground/30'
                  }`}>
                  {isNewest && <span className="h-1 w-1 rounded-full bg-primary-foreground"></span>}
                </span>

                <div className="space-y-1 bg-muted/20 border border-border rounded p-2.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${evt.badgeColor}`}>
                      {evt.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(evt.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-foreground/90 font-semibold leading-relaxed mt-1.5">{evt.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentsList = (readOnly: boolean) => (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-muted/20 border-b border-border pb-4">
        <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" weight="bold" />
          Verification Documents
        </CardTitle>
        <CardDescription className="text-xs font-medium">Uploaded verification checks.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {app.documents.length === 0 ? (
          <div className="p-8 text-center bg-muted/10 rounded border border-dashed border-border flex flex-col items-center justify-center gap-2 select-none">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground font-semibold">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {app.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded border border-border bg-card hover:bg-muted/30 transition-colors gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded text-primary">
                    <FileText className="h-5 w-5" weight="bold" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-bold text-sm truncate max-w-[150px] sm:max-w-xs text-foreground leading-normal">{doc.originalName || doc.publicId}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {doc.documentType} • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end shrink-0">
                  <div className="flex gap-1.5">
                    {doc.secureUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPreviewUrl(doc.secureUrl);
                          setPreviewTitle(doc.originalName);
                        }}
                        className="h-8 shadow-sm cursor-pointer font-bold text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {!readOnly && app.status === 'DRAFT' && isRoleOfficer && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(doc.publicId)}
                        className="h-8 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20 text-rose-600 cursor-pointer shadow-sm font-bold text-xs"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {doc.status === 'VERIFIED' && (
                    <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20 uppercase font-mono">
                      Verified
                    </span>
                  )}
                  {doc.status === 'REJECTED' && (
                    <span className="inline-flex items-center rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/20 uppercase font-mono">
                      Rejected
                    </span>
                  )}
                  {doc.status === 'PENDING' && (
                    <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20 uppercase font-mono">
                      Pending
                    </span>
                  )}

                  {!readOnly && app.status === 'UNDER_REVIEW' && doc.status === 'PENDING' && user && ['CREDIT_ANALYST', 'SUPER_ADMIN'].includes(user.role) && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                        className="h-7 text-[10px] border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer shadow-sm font-bold"
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                        className="h-7 text-[10px] border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20 text-rose-600 cursor-pointer shadow-sm font-bold"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderOfficerWorkspace = () => (
    <div className="space-y-6">
      {/* Upload document card */}
      {app.status === 'DRAFT' && (
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
              <UploadSimple className="h-5 w-5 text-primary" weight="bold" />
              Upload Required Document
            </CardTitle>
            <CardDescription className="text-xs font-medium">Add applicant verification documents.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docType" className="text-xs font-bold text-foreground">Document Type</Label>
              <select
                id="docType"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as any)}
                disabled={uploadLoading}
                className="w-full h-10 px-3 rounded border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
              >
                <option value="PAN">PAN Card Scan</option>
                <option value="AADHAAR">Aadhaar Card Scan</option>
                <option value="SALARY_SLIP">Salary Slip Statement</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-foreground">Select File</Label>
              <div
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50 hover:bg-muted/20'
                } ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Input
                  id="file-upload-input"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size exceeds 10MB limit.');
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                  disabled={uploadLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="flex flex-col items-center text-center space-y-1.5 pointer-events-none">
                  <div className="p-2 bg-muted rounded-full text-muted-foreground">
                    <UploadSimple className="h-5 w-5" weight="bold" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    <span className="text-primary hover:underline">Click to upload</span> or drag files
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-2.5 border border-border rounded bg-muted/20">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs truncate font-bold">{selectedFile.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 shrink-0 cursor-pointer" 
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    disabled={uploadLoading}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              
              {uploadLoading && uploadProgress > 0 && (
                <div className="space-y-1 pt-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleDocumentUpload}
              disabled={uploadLoading || !selectedFile}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold flex items-center justify-center gap-1.5 shadow h-10 rounded cursor-pointer mt-2"
            >
              {uploadLoading ? (
                <>
                  <ArrowsCounterClockwise className="h-4 w-4 animate-spin" weight="bold" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadSimple className="h-4 w-4" weight="bold" />
                  Upload Document
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Render active offer if any */}
      {app.offer && (
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
              <Percent className="h-5 w-5 text-primary" weight="bold" />
              Active Loan Offer
            </CardTitle>
            <CardDescription className="text-xs font-medium">Offered terms sent to customer.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-sm font-semibold select-none">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/10 border border-border p-3 rounded">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Interest Rate</span>
                <p className="text-base font-bold text-foreground mt-1">{app.offer.interestRate}% p.a.</p>
              </div>
              <div className="bg-muted/10 border border-border p-3 rounded">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tenure</span>
                <p className="text-base font-bold text-foreground mt-1">{app.offer.tenureMonths} Months</p>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 p-4 rounded text-center">
              <span className="text-xs text-primary font-bold uppercase tracking-wider">Monthly EMI</span>
              <p className="text-2xl font-extrabold text-primary mt-1">{formatCurrency(app.offer.emiAmount)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAnalystWorkspace = () => (
    <div className="space-y-6">
      {/* Credit Risk assessment workspace */}
      {app.status === 'UNDER_REVIEW' && (!app.assessment || app.assessment.status === 'PENDING') && (
        <Card className="border-border border-amber-500/30 shadow-sm">
          <CardHeader className="bg-amber-500/5 border-b border-amber-500/25 pb-4">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <Pulse className="h-5 w-5 animate-pulse" weight="bold" />
              Underwriting Assessment Workspace
            </CardTitle>
            <CardDescription className="text-xs font-medium">Evaluate credit rules and submit recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {assessmentStep === 0 ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-bold text-foreground">Analysis Decision Notes</Label>
                  <textarea
                    id="notes"
                    rows={4}
                    placeholder="Enter analytical decision notes, risk arguments, or credit history findings..."
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                    className="w-full p-3 rounded border border-border bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm resize-y"
                  />
                </div>
                <Button
                  onClick={handleRunAssessment}
                  disabled={!assessmentNotes.trim()}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 rounded cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calculator className="h-4.5 w-4.5" />
                  Evaluate Credit Scoring Engine
                </Button>
              </div>
            ) : (
              previewAssessment && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-muted/20 border border-border rounded space-y-3 font-semibold text-xs">
                    <div className="flex justify-between border-b border-border pb-2.5">
                      <span className="text-muted-foreground">Calculated Credit Score</span>
                      <span className="text-foreground font-extrabold">{previewAssessment.creditScore} / 900</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2.5">
                      <span className="text-muted-foreground">Risk Category Classification</span>
                      <span className={`font-bold ${previewAssessment.riskLevel === 'LOW' ? 'text-emerald-600' : previewAssessment.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-rose-600'}`}>
                        {previewAssessment.riskLevel} RISK
                      </span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-muted-foreground">System Recommendation</span>
                      <span className="text-primary font-bold">{previewAssessment.recommendation}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAssessmentStep(0)}
                      disabled={saveLoading}
                      className="flex-1 border-border bg-card text-foreground hover:bg-muted font-bold h-10 cursor-pointer shadow-sm"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSaveAssessment}
                      disabled={saveLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 cursor-pointer shadow"
                    >
                      {saveLoading ? 'Locking...' : 'Lock Decision Report'}
                    </Button>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Locked Assessment summary */}
      {app.assessment && app.assessment.status === 'COMPLETED' && (
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" weight="fill" />
              Underwriting Audit Locked
            </CardTitle>
            <CardDescription className="text-xs font-medium">Locked assessment criteria.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs font-semibold select-none">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/10 border border-border p-2.5 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Score</span>
                <p className="text-sm font-bold text-foreground mt-1">{app.assessment.creditScore}</p>
              </div>
              <div className="bg-muted/10 border border-border p-2.5 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Risk Level</span>
                <p className="text-sm font-bold text-foreground mt-1">{app.assessment.riskLevel}</p>
              </div>
              <div className="bg-muted/10 border border-border p-2.5 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Rec</span>
                <p className="text-sm font-bold text-foreground mt-1">{app.assessment.recommendation}</p>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <span className="text-muted-foreground font-bold text-[10px] uppercase">Decision Notes</span>
              <p className="p-3 bg-muted/20 border border-border rounded italic text-foreground/80 font-medium">
                "{app.assessment.assessmentNotes}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderApproverWorkspace = () => (
    <div className="space-y-6">
      {/* Credit underwriting locked report (Approver needs to see this) */}
      {app.assessment && (
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" weight="fill" />
              Locked Risk Report
            </CardTitle>
            <CardDescription className="text-xs font-medium">Underwriter credit analysis findings.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-3.5 text-xs font-semibold">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/10 border border-border p-2 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Score</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{app.assessment.creditScore}</p>
              </div>
              <div className="bg-muted/10 border border-border p-2 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Risk</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{app.assessment.riskLevel}</p>
              </div>
              <div className="bg-muted/10 border border-border p-2 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Rec</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{app.assessment.recommendation}</p>
              </div>
            </div>
            <div className="text-left space-y-1">
              <span className="text-[9px] text-muted-foreground font-bold uppercase">Decision Notes</span>
              <div className="p-3 bg-muted/20 border border-border rounded italic font-medium">"{app.assessment.assessmentNotes}"</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offer generated card / Workspace */}
      {app.status === 'APPROVED' && !app.offer && (
        <Card className="border-border border-primary/30 shadow-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/20 pb-4">
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-primary">
              <Percent className="h-5 w-5" weight="bold" />
              Configure Offer Terms
            </CardTitle>
            <CardDescription className="text-xs font-medium">Step {offerStep + 1} of 2: Define and review interest rate parameters.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleGenerateOffer} className="space-y-4">
              {offerStep === 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="interestRate" className="text-xs font-bold text-foreground">Interest Rate (% p.a.)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        min="1"
                        max="50"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        className="bg-background border-border focus-visible:ring-primary text-foreground h-10 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tenureMonths" className="text-xs font-bold text-foreground">Tenure (Months)</Label>
                      <Input
                        id="tenureMonths"
                        type="number"
                        min="1"
                        max="360"
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(parseInt(e.target.value) || 0)}
                        className="bg-background border-border focus-visible:ring-primary text-foreground h-10 font-semibold"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (interestRate > 0 && tenureMonths > 0) setOfferStep(1);
                      else toast.error('Rate and tenure must be positive numbers');
                    }}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 rounded cursor-pointer"
                  >
                    Calculate EMI &gt;
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-muted/20 border border-border rounded space-y-2.5 font-semibold text-xs">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Calculated EMI</span>
                      <span className="text-primary font-bold">{formatCurrency(calculatedEmi)} / mo</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-muted-foreground">Total Repayments</span>
                      <span className="text-foreground font-bold">{formatCurrency(calculatedTotalRepayment)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setOfferStep(0)}
                      disabled={offerLoading}
                      className="flex-1 border-border bg-card text-foreground hover:bg-muted font-bold h-10 cursor-pointer shadow-sm"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={offerLoading}
                      className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 cursor-pointer shadow"
                    >
                      {offerLoading ? 'Generating...' : 'Generate Offer'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Offer Display (Acceptance check) */}
      {app.offer && !app.disbursement && (
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                <Percent className="h-5 w-5 text-primary" weight="bold" />
                Lending Offer Terms
              </CardTitle>
              <CardDescription className="text-xs font-medium">Terms approved and issued.</CardDescription>
            </div>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
              app.offer.offerStatus === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              {app.offer.offerStatus}
            </span>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs font-semibold select-none">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted/10 border border-border p-2 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Interest Rate</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{app.offer.interestRate}% p.a.</p>
              </div>
              <div className="bg-muted/10 border border-border p-2 rounded">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Tenure</span>
                <p className="text-sm font-bold text-foreground mt-0.5">{app.offer.tenureMonths} Months</p>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 p-3 rounded text-center">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">EMI Release Amount</span>
              <p className="text-xl font-extrabold text-primary mt-0.5">{formatCurrency(app.offer.emiAmount)} / mo</p>
            </div>

            {/* Release disbursement payout funds if offer accepted */}
            {app.status === 'OFFER_ACCEPTED' && (
              <div className="pt-2">
                <Button
                  onClick={handleDisburseLoan}
                  disabled={disburseLoading}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-11 rounded cursor-pointer shadow flex items-center justify-center gap-1.5"
                >
                  <CurrencyInr className="h-4.5 w-4.5" weight="bold" />
                  {disburseLoading ? 'Executing Transfer...' : 'Authorize Disbursement Release'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disbursement Record display */}
      {app.disbursement && (
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                <CurrencyInr className="h-5 w-5 text-primary" weight="bold" />
                Disbursement Cleared
              </CardTitle>
              <CardDescription className="text-xs font-medium">Funds successfully dispatched.</CardDescription>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20 uppercase">
              {app.disbursement.status}
            </span>
          </CardHeader>
          <CardContent className="pt-5 space-y-3.5 text-xs font-semibold select-none">
            <div className="flex justify-between border-b border-border pb-2.5">
              <span className="text-muted-foreground">Cleared Payout</span>
              <span className="text-foreground font-extrabold">{formatCurrency(app.disbursement.amount)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2.5">
              <span className="text-muted-foreground">Transaction ID Token</span>
              <span className="font-mono text-primary font-bold bg-muted px-2 py-0.5 border border-border rounded">{app.disbursement.referenceNumber}</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span className="text-muted-foreground">Cleared On</span>
              <span className="text-foreground font-bold">{new Date(app.disbursement.disbursedAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Details Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-start gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.back()}
            className="mt-1 shadow-sm h-8 w-8 p-0 shrink-0 border-border bg-card hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5 text-foreground" weight="bold" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-primary font-extrabold tracking-wider">{app.applicationNumber}</span>
              {getStatusBadge(app.status)}
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight mt-1 capitalize leading-snug">{app.applicantName}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-bold">
              <span>{app.loanType} LOAN</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{formatCurrency(app.loanAmount)}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="font-mono text-xs">{new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Global actions based on current states */}
        <div className="flex flex-wrap gap-2 justify-end">
          {app.status === 'DRAFT' && isRoleOfficer && (
            <Button
              onClick={() => handleStatusTransition('SUBMITTED')}
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold cursor-pointer shadow h-10"
            >
              Submit Application
            </Button>
          )}

          {app.status === 'SUBMITTED' && user && ['CREDIT_ANALYST', 'SUPER_ADMIN'].includes(user.role) && (
            <Button
              onClick={() => handleStatusTransition('UNDER_REVIEW')}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shadow h-10"
            >
              Start Credit Review
            </Button>
          )}

          {app.status === 'UNDER_REVIEW' && isRoleAllowedToChangeStatus && (
            <div className="flex gap-2">
              {user && ['APPROVER', 'SUPER_ADMIN'].includes(user.role) && (
                <Button
                  onClick={() => handleStatusTransition('APPROVED')}
                  disabled={actionLoading || !app.assessment || app.assessment.status !== 'COMPLETED'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow h-10"
                  title={(!app.assessment || app.assessment.status !== 'COMPLETED') ? "Assessment must be locked first." : ""}
                >
                  Approve Loan
                  {!app.assessment && ' (Assessment Pending)'}
                </Button>
              )}
              <Button
                onClick={() => handleStatusTransition('REJECTED')}
                disabled={actionLoading}
                variant="destructive"
                className="font-bold cursor-pointer shadow h-10"
              >
                Reject Loan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main double column dashboard (No Tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profiles & Timeline Logs */}
        <div className="lg:col-span-2 space-y-6">
          {renderApplicantProfileCard()}
          {renderDocumentsList(user?.role !== 'SUPER_ADMIN' && user?.role !== 'LOAN_OFFICER' && user?.role !== 'CREDIT_ANALYST')}
        </div>

        {/* Right Column: Dynamic workspace specific to user role */}
        <div className="space-y-6">
          {/* Timeline Audit Log */}
          {renderTimelineCard()}

          {/* Dynamic workflows */}
          {user  .role === 'LOAN_OFFICER' && renderOfficerWorkspace()}
          {user.role === 'CREDIT_ANALYST' && renderAnalystWorkspace()}
          {user.role === 'APPROVER' && renderApproverWorkspace()}

          {/* Super Admin sees all workspace actions sequentially */}
          {user.role === 'SUPER_ADMIN' && (
            <div className="space-y-6">
              {renderOfficerWorkspace()}
              {renderAnalystWorkspace()}
              {renderApproverWorkspace()}
            </div>
          )}
        </div>
      </div>

      {/* PDF / Image preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-card text-card-foreground border-border rounded-lg shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b shrink-0 bg-background/95 backdrop-blur z-10">
            <DialogTitle className="text-base font-bold truncate pr-6 text-foreground">{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-muted/20 relative overflow-hidden">
            {previewUrl && (
              previewUrl.toLowerCase().endsWith('.pdf') ? (
                <PdfViewer url={previewUrl} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={previewUrl} 
                  className="absolute inset-0 w-full h-full object-contain border-0 p-4" 
                  alt={previewTitle}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
