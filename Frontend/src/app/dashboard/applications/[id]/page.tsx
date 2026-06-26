'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  Clock,
  AlertTriangle,
  Users,
  Terminal,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  ShieldCheck,
  BarChart2,
  Check,
  X,
  History,
  Shield,
  Percent,
  Eye,
  Trash2,
  ArrowLeft,
  User,
  MoreVertical,
  CheckCircle2,
  ChevronRight,
  Calculator,
  Calendar,
  AlertCircle,
  UploadCloud,
  Briefcase,
  FileCheck,
  FileDigit,
  Image as ImageIcon
} from 'lucide-react';
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
    setAssessmentStep(1); // Move to preview step
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
        // Loan officer submit application endpoint
        await api.post(`/applications/${id}/submit`, {});
        toast.success('Application submitted successfully.');
      } else {
        // General status transition endpoint
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
      toast.error('Please select a file to upload');
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
        toast.success(`Document uploaded: ${selectedFile.name}`);
        setSelectedFile(null);
        setUploadProgress(0);

        // Clear input element
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
      <div className="max-w-md mx-auto mt-10 p-6 bg-surface border border-border rounded-lg text-center space-y-4 transition-colors duration-200">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Error Retrieving Data</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer">
          Go Back
        </Button>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center text-muted-foreground mt-10">
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
        return <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground border border-border">Draft</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-600 px-3 py-1 text-sm font-semibold border border-blue-500/20 animate-pulse dark:bg-blue-500/20 dark:text-blue-400">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 px-3 py-1 text-sm font-semibold border border-amber-500/20 font-mono dark:text-amber-500">Under Review</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-sm font-semibold border border-emerald-500/20 font-mono dark:text-emerald-500">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded-full bg-rose-500/10 text-rose-600 px-3 py-1 text-sm font-semibold border border-rose-500/20 font-mono dark:text-rose-500">Rejected</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center rounded-full bg-purple-500/10 text-purple-600 px-3 py-1 text-sm font-semibold border border-purple-500/20 font-mono dark:text-purple-400">Disbursed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground border border-border">{statusStr}</span>;
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
    return Math.round(emi * 100) / 100; // round to 2 decimal places
  })();

  const calculatedTotalRepayment = calculatedEmi * tenureMonths;

  const getCombinedTimeline = () => {
    if (!app) return [];
    const events: any[] = [];

    // 1. Add StatusHistory entries
    app.statusHistory.forEach((hist) => {
      events.push({
        id: `status-${hist.id}`,
        type: 'STATUS_CHANGE',
        title: hist.newStatus === 'DRAFT' ? 'Application Drafted' :
          hist.newStatus === 'SUBMITTED' ? 'Application Submitted' :
            hist.newStatus === 'UNDER_REVIEW' ? 'Under Review Started' :
              hist.newStatus === 'APPROVED' ? 'Application Approved' :
                hist.newStatus === 'OFFER_GENERATED' ? 'Lending Offer Generated' :
                  hist.newStatus === 'OFFER_ACCEPTED' ? 'Customer Acceptance Recorded' :
                    hist.newStatus === 'REJECTED' ? 'Application Rejected' :
                      hist.newStatus === 'DISBURSED' ? 'Funds Disbursed' :
                        `Status Changed: ${hist.newStatus}`,
        timestamp: hist.changedAt,
        changedBy: hist.changedBy,
        description: hist.oldStatus
          ? `Workflow status updated from ${hist.oldStatus} to ${hist.newStatus}`
          : `Application initialized as ${hist.newStatus}`,
        badgeColor: hist.newStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
          hist.newStatus === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
            hist.newStatus === 'DISBURSED' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
              hist.newStatus === 'OFFER_ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                hist.newStatus === 'OFFER_GENERATED' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400' :
                  'bg-muted text-muted-foreground border border-border'
      });
    });

    // 2. Add Assessment Audit Events (Assessment Completed)
    if (app.assessment && app.assessment.status === 'COMPLETED') {
      events.push({
        id: `assessment-${app.assessment.id}`,
        type: 'ASSESSMENT_COMPLETED',
        title: 'Credit Underwriting Locked',
        timestamp: app.assessment.assessedAt,
        changedBy: app.assessment.assessedBy,
        description: `Credit Score: ${app.assessment.creditScore} (${app.assessment.riskLevel} Risk). Recommendation: ${app.assessment.recommendation}`,
        badgeColor: 'bg-muted text-muted-foreground border border-border'
      });
    }

    // 3. Add Offer Generated Event
    if (app.offer) {
      events.push({
        id: `offer-gen-${app.offer.id}`,
        type: 'OFFER_GENERATED',
        title: 'Loan Offer Generated',
        timestamp: app.offer.generatedAt,
        changedBy: null,
        description: `Offer details: ${formatCurrency(app.offer.loanAmount)} at ${app.offer.interestRate}% interest, ${app.offer.tenureMonths} months tenure, Monthly EMI: ${formatCurrency(app.offer.emiAmount)}`,
        badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400'
      });

      // 4. Add Customer Acceptance Recorded Event
      if (app.offer.acceptedAt) {
        events.push({
          id: `offer-acc-${app.offer.id}`,
          type: 'CUSTOMER_ACCEPTANCE',
          title: 'Customer Acceptance Recorded',
          timestamp: app.offer.acceptedAt,
          changedBy: null,
          description: `Lending terms accepted by client. Monthly EMI: ${formatCurrency(app.offer.emiAmount)}`,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        });
      }
    }

    // 5. Add Loan Disbursed Event
    if (app.disbursement) {
      events.push({
        id: `disbursement-${app.disbursement.id}`,
        type: 'LOAN_DISBURSED',
        title: 'Loan Disbursed successfully',
        timestamp: app.disbursement.disbursedAt,
        changedBy: app.disbursement.disbursedBy,
        description: `Funds released. Transaction Reference: ${app.disbursement.referenceNumber} (${app.disbursement.status})`,
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
      });
    }

    // Sort events descending by timestamp (newest first)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const combinedTimeline = getCombinedTimeline();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-start gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.back()}
            className="mt-1 shadow-sm h-8 w-8 p-0 shrink-0 border-border bg-card hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-primary font-bold tracking-wider">{app.applicationNumber}</span>
              {getStatusBadge(app.status)}
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mt-1">{app.applicantName}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
              <span>{app.loanType} Loan</span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border" />
              <span>{formatCurrency(app.loanAmount)}</span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border" />
              <span className="font-mono text-xs">{new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Workflow actions at the top */}
        <div className="flex flex-wrap gap-2 justify-end">
          {app.status === 'DRAFT' && isRoleOfficer && (
            <Button
              onClick={() => handleStatusTransition('SUBMITTED')}
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer shadow-sm"
            >
              Submit Application
            </Button>
          )}

          {app.status === 'SUBMITTED' && user && (user.role === 'CREDIT_ANALYST' || user.role === 'SUPER_ADMIN') && (
            <Button
              onClick={() => handleStatusTransition('UNDER_REVIEW')}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer shadow-sm"
            >
              Start Credit Review
            </Button>
          )}

          {app.status === 'UNDER_REVIEW' && isRoleAllowedToChangeStatus && (
            <>
              {user && ['APPROVER', 'SUPER_ADMIN'].includes(user.role) && (
                <Button
                  onClick={() => handleStatusTransition('APPROVED')}
                  disabled={actionLoading || !app.assessment || app.assessment.status !== 'COMPLETED'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  title={(!app.assessment || app.assessment.status !== 'COMPLETED') ? "Assessment must be completed first" : ""}
                >
                  Approve Loan
                </Button>
              )}
              {user && ['CREDIT_ANALYST', 'APPROVER', 'SUPER_ADMIN'].includes(user.role) && (
                <Button
                  onClick={() => handleStatusTransition('REJECTED')}
                  disabled={actionLoading}
                  variant="destructive"
                  className="font-semibold cursor-pointer shadow-sm"
                >
                  Reject Loan
                </Button>
              )}
            </>
          )}

          {app.status === 'OFFER_GENERATED' && user && (user.role === 'LOAN_OFFICER' || user.role === 'SUPER_ADMIN') && (
            <Button
              onClick={handleRecordCustomerAcceptance}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-sm"
            >
              Record Customer Acceptance
            </Button>
          )}

          {app.status === 'OFFER_ACCEPTED' && user && (user.role === 'APPROVER' || user.role === 'SUPER_ADMIN') && (
            <Button
              onClick={handleDisburseLoan}
              disabled={disburseLoading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-sm"
            >
              {disburseLoading ? 'Executing...' : 'Disburse Funds'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="inline-flex h-20 items-center justify-start rounded-xl bg-muted/40 p-1.5 text-muted-foreground overflow-x-auto w-full xl:w-fit border border-border/50 shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
          <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-5 py-2.5 text-sm font-semibold transition-all data-active:bg-black data-active:text-white data-active:shadow hover:text-foreground hover:bg-muted/60 data-active:hover:bg-black">
            <User className="h-4 w-4 mr-2.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all data-active:bg-black data-active:text-white data-active:shadow hover:text-foreground hover:bg-muted/60 data-active:hover:bg-black">
            <FileText className="h-4 w-4 mr-2.5" /> Documents
          </TabsTrigger>
          <TabsTrigger value="assessment" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all data-active:bg-black data-active:text-white data-active:shadow hover:text-foreground hover:bg-muted/60 data-active:hover:bg-black">
            <Shield className="h-4 w-4 mr-2.5" /> Assessment
          </TabsTrigger>
          <TabsTrigger value="offer" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all data-active:bg-black data-active:text-white data-active:shadow hover:text-foreground hover:bg-muted/60 data-active:hover:bg-black">
            <Percent className="h-4 w-4 mr-2.5" /> Offer
          </TabsTrigger>
          <TabsTrigger value="disbursement" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all data-active:bg-black data-active:text-white data-active:shadow hover:text-foreground hover:bg-muted/60 data-active:hover:bg-black">
            <DollarSign className="h-4 w-4 mr-2.5" /> Disbursement
          </TabsTrigger>
          <TabsTrigger value="audit" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all data-active:bg-black data-active:text-white data-active:shadow hover:text-foreground hover:bg-muted/60 data-active:hover:bg-black">
            <History className="h-4 w-4 mr-2.5" /> Audit Timeline
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="m-0 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/20 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Applicant Profile
                </CardTitle>
                <CardDescription>Personal and financial details provided during application.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Applicant Name</span>
                    <p className="font-semibold text-sm mt-1 text-foreground">{app.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">PAN Card Number</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-semibold tracking-wider text-sm bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                        {app.pan}
                      </span>
                      <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono">
                        {user?.role === 'SUPER_ADMIN' || user?.role === 'LOAN_OFFICER' ? 'Unmasked' : 'Masked (RBAC)'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Email Address</span>
                    <p className="text-sm mt-1 text-foreground">{app.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Phone Number</span>
                    <p className="text-sm mt-1 font-mono text-foreground">{app.phone}</p>
                  </div>
                  <div className="col-span-1 md:col-span-4 border-t border-border my-2"></div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Loan Type</span>
                    <p className="text-sm mt-1 font-bold text-primary">{app.loanType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Employment Nature</span>
                    <p className="text-sm mt-1 font-medium text-foreground">{app.employmentType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Requested Amount</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(app.loanAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Net Monthly Income</span>
                    <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(app.monthlyIncome)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="m-0 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/20 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Verification Documents
                </CardTitle>
                <CardDescription>KYC and income proofs associated with this application.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  {app.documents.length === 0 ? (
                    <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-3">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground font-medium">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {app.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors gap-4 shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-md shrink-0">
                              {doc.secureUrl?.endsWith('.pdf') ? (
                                <FileDigit className="h-6 w-6 text-primary" />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[200px] sm:max-w-md text-foreground">{doc.originalName || doc.publicId}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                  {doc.documentType}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-3 md:ml-auto">
                            <div className="flex gap-2 mr-2">
                              {doc.secureUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPreviewUrl(doc.secureUrl);
                                    setPreviewTitle(doc.originalName);
                                  }}
                                  className="h-8 shadow-sm cursor-pointer"
                                  title="View/Download"
                                >
                                  <Eye className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                              )}
                              
                              {app.status === 'DRAFT' && isRoleOfficer && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteDocument(doc.publicId)}
                                  className="h-8 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20 text-rose-600 cursor-pointer shadow-sm"
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              )}
                            </div>

                            {/* Verification status label */}
                            {doc.status === 'VERIFIED' && (
                              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                                <Check className="h-3.5 w-3.5 mr-1" /> Verified
                              </span>
                            )}
                            {doc.status === 'REJECTED' && (
                              <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 border border-rose-500/20">
                                <X className="h-3.5 w-3.5 mr-1" /> Rejected
                              </span>
                            )}
                            {doc.status === 'PENDING' && (
                              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20">
                                Pending Review
                              </span>
                            )}

                            {/* Verifier Actions (Only for Credit Analyst / Super Admin in UNDER_REVIEW status) */}
                            {app.status === 'UNDER_REVIEW' && doc.status === 'PENDING' && user && (user.role === 'CREDIT_ANALYST' || user.role === 'SUPER_ADMIN') && (
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                                  className="h-8 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer shadow-sm"
                                >
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                                  className="h-8 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20 text-rose-600 cursor-pointer shadow-sm"
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
                </div>

                {/* Upload Form - Only visible to Loan Officer or Super Admin if status is DRAFT */}
                {app.status === 'DRAFT' && isRoleOfficer && (
                  <div className="border-t border-border pt-6 mt-6 space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Upload New Document</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="docType">Document Category</Label>
                        <select
                          id="docType"
                          value={selectedDocType}
                          onChange={(e) => setSelectedDocType(e.target.value as any)}
                          disabled={uploadLoading}
                          className="w-full h-10 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                        >
                          <option value="PAN">PAN Card Scan</option>
                          <option value="AADHAAR">Aadhaar Card Scan</option>
                          <option value="SALARY_SLIP">Salary Slip Statement</option>
                          <option value="BANK_STATEMENT">Bank Statement</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <Label>Select File</Label>
                        <div
                          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                            isDragging
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:bg-muted/30'
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
                          <div className="flex flex-col items-center text-center space-y-2 pointer-events-none">
                            <div className="p-3 bg-muted rounded-full">
                              <UploadCloud className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </div>
                            <p className="text-xs text-muted-foreground">PDF, JPG or PNG (max. 10MB)</p>
                          </div>
                        </div>

                        {selectedFile && (
                          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm truncate font-medium">{selectedFile.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 shrink-0" 
                              onClick={() => {
                                setSelectedFile(null);
                                const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              disabled={uploadLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {uploadLoading && uploadProgress > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300 ease-in-out" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleDocumentUpload}
                      disabled={uploadLoading || !selectedFile}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm mt-4"
                    >
                      {uploadLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Uploading Document...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSESSMENT TAB */}
          <TabsContent value="assessment" className="m-0 space-y-6">
            {!app.assessment && app.status !== 'UNDER_REVIEW' && (
              <Card className="border-border shadow-sm border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-foreground mb-1">Assessment Not Started</p>
                  <p className="text-sm max-w-md mx-auto">The credit assessment phase has not been initiated for this application yet. Move the application to "Under Review" to begin.</p>
                </CardContent>
              </Card>
            )}

            {app.assessment && app.assessment.status === 'COMPLETED' && (
              <Card className="border-border shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 h-32 w-36 bg-primary/5 rounded-bl-full pointer-events-none border-l border-b border-primary/10"></div>
                <CardHeader className="bg-muted/20 border-b border-border pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Credit Underwriting Summary
                  </CardTitle>
                  <CardDescription>Official risk profiling audit locked in system.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Credit Score */}
                    <div className="p-5 bg-card rounded-xl border border-border flex flex-col justify-center shadow-sm items-center text-center">
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Credit Score</span>
                      <div className="mt-3 flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-extrabold text-foreground tracking-tight">{app.assessment.creditScore}</span>
                        <span className="text-sm text-muted-foreground font-mono">/ 900</span>
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="p-5 bg-card rounded-xl border border-border flex flex-col justify-center shadow-sm items-center text-center">
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Risk Profile</span>
                      <div className="mt-4">
                        {app.assessment.riskLevel === 'LOW' && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-600 border border-emerald-500/20">
                            Low Risk
                          </span>
                        )}
                        {app.assessment.riskLevel === 'MEDIUM' && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-600 border border-amber-500/20">
                            Medium Risk
                          </span>
                        )}
                        {app.assessment.riskLevel === 'HIGH' && (
                          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-4 py-1.5 text-sm font-bold text-rose-600 border border-rose-500/20">
                            High Risk
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-5 bg-card rounded-xl border border-border flex flex-col justify-center shadow-sm items-center text-center">
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">System Recommendation</span>
                      <div className="mt-4">
                        {app.assessment.recommendation === 'APPROVE' && (
                          <span className="inline-flex items-center rounded bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                            Approve
                          </span>
                        )}
                        {app.assessment.recommendation === 'MANUAL_REVIEW' && (
                          <span className="inline-flex items-center rounded bg-amber-500/10 px-3 py-1.5 text-sm font-bold text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                            Manual Review
                          </span>
                        )}
                        {app.assessment.recommendation === 'REJECT' && (
                          <span className="inline-flex items-center rounded bg-rose-500/10 px-3 py-1.5 text-sm font-bold text-rose-600 border border-rose-500/20 uppercase tracking-wider">
                            Reject
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assessment Notes */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground text-sm font-semibold">Underwriter Notes</span>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm text-foreground italic leading-relaxed min-h-[80px]">
                      "{app.assessment.assessmentNotes}"
                    </div>
                  </div>

                  {/* Assessor Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>Assessed by:</span>
                      <span className="font-semibold text-foreground">
                        {app.assessment.assessedBy ? `${app.assessment.assessedBy.firstName} ${app.assessment.assessedBy.lastName}` : 'System'}
                      </span>
                      {app.assessment.assessedBy && (
                        <span className="text-xs text-muted-foreground border border-border bg-card px-2 py-0.5 rounded uppercase font-mono tracking-wider ml-1">
                          {app.assessment.assessedBy.role.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-mono text-foreground">
                        {new Date(app.assessment.assessedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment Form Area */}
            {app.status === 'UNDER_REVIEW' && user && ['CREDIT_ANALYST', 'SUPER_ADMIN'].includes(user.role) && (!app.assessment || app.assessment.status === 'PENDING') && (
              <Card className="shadow-sm border-amber-500/30">
                <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-500">
                    <Activity className="h-5 w-5 animate-pulse" />
                    Perform Credit Underwriting
                  </CardTitle>
                  <CardDescription>Step {assessmentStep + 1} of 2: {assessmentStep === 0 ? 'Analyze applicant profile and log findings.' : 'Review rule engine outputs and confirm.'}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {assessmentStep === 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-base">Decision Notes</Label>
                        <textarea
                          id="notes"
                          rows={4}
                          placeholder="Enter analytical decision notes, risk mitigation arguments, or policy exceptions..."
                          value={assessmentNotes}
                          onChange={(e) => setAssessmentNotes(e.target.value)}
                          disabled={saveLoading}
                          className="w-full p-4 rounded-md border border-border bg-card text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm resize-y"
                        />
                      </div>
                      <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                          type="button"
                          onClick={handleRunAssessment}
                          disabled={saveLoading || !assessmentNotes.trim()}
                          className="bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer shadow-sm h-11 px-8"
                        >
                          Continue to Rule Engine &gt;
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Preview Calculation Panel */}
                  {assessmentStep === 1 && previewAssessment && (
                    <div className="p-5 bg-card rounded-lg border border-border shadow-sm animate-in fade-in slide-in-from-right-4 space-y-6">
                      <div className="flex items-center gap-2 pb-3 border-b border-border">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Rule Engine Outputs</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Calculated Score</Label>
                          <p className="text-2xl font-bold mt-1 text-foreground">{previewAssessment.creditScore} <span className="text-sm text-muted-foreground font-mono font-normal">/ 900</span></p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Risk Profile</Label>
                          <div className="mt-2">
                            {previewAssessment.riskLevel === 'LOW' && (
                              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-600 border border-emerald-500/20">
                                Low Risk
                              </span>
                            )}
                            {previewAssessment.riskLevel === 'MEDIUM' && (
                              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-sm font-semibold text-amber-600 border border-amber-500/20">
                                Medium Risk
                              </span>
                            )}
                            {previewAssessment.riskLevel === 'HIGH' && (
                              <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2.5 py-1 text-sm font-semibold text-rose-600 border border-rose-500/20">
                                High Risk
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Recommendation</Label>
                          <div className="mt-2">
                            {previewAssessment.recommendation === 'APPROVE' && (
                              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                                Approve
                              </span>
                            )}
                            {previewAssessment.recommendation === 'MANUAL_REVIEW' && (
                              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-sm font-semibold text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                                Manual Review
                              </span>
                            )}
                            {previewAssessment.recommendation === 'REJECT' && (
                              <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2.5 py-1 text-sm font-semibold text-rose-600 border border-rose-500/20 uppercase tracking-wider">
                                Reject
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                        <Button
                          type="button"
                          onClick={() => setAssessmentStep(0)}
                          disabled={saveLoading}
                          variant="outline"
                          className="flex-1 shadow-sm border-border bg-card hover:bg-muted text-foreground cursor-pointer h-12"
                        >
                          &lt; Back to Notes
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSaveAssessment}
                          disabled={saveLoading || !previewAssessment || !assessmentNotes.trim()}
                          className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer shadow-sm h-12"
                        >
                          {saveLoading ? (
                            <><Clock className="mr-2 h-4 w-4 animate-spin" /> Locking Decisions...</>
                          ) : (
                            'Save & Lock Assessment'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* OFFER TAB */}
          <TabsContent value="offer" className="m-0 space-y-6">
            {!app.offer && app.status !== 'APPROVED' && (
              <Card className="border-border shadow-sm border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Percent className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-foreground mb-1">No Active Offer</p>
                  <p className="text-sm max-w-md mx-auto">Loan must be Approved before terms can be generated and an offer can be made.</p>
                </CardContent>
              </Card>
            )}

            {/* Offer Generation Workspace */}
            {app.status === 'APPROVED' && user && (user.role === 'APPROVER' || user.role === 'SUPER_ADMIN') && (
              <Card className="shadow-sm border-blue-500/30">
                <CardHeader className="bg-blue-500/5 border-b border-blue-500/20 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-500">
                    <Percent className="h-5 w-5" />
                    Configure Loan Terms
                  </CardTitle>
                  <CardDescription>Step {offerStep + 1} of 2: {offerStep === 0 ? 'Define interest rate and tenure.' : 'Review estimated EMI and confirm.'}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleGenerateOffer} className="space-y-6">
                    {offerStep === 0 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="interestRate" className="text-base font-medium">Annual Interest Rate (%)</Label>
                            <div className="relative">
                              <Input
                                id="interestRate"
                                type="number"
                                step="0.01"
                                min="1"
                                max="50"
                                value={interestRate}
                                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                                disabled={offerLoading}
                                className="bg-card border-border focus-visible:ring-primary text-foreground pl-10 h-12 text-lg shadow-sm"
                              />
                              <Percent className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tenureMonths" className="text-base font-medium">Tenure (Months)</Label>
                            <div className="relative">
                              <Input
                                id="tenureMonths"
                                type="number"
                                min="1"
                                max="360"
                                value={tenureMonths}
                                onChange={(e) => setTenureMonths(parseInt(e.target.value) || 0)}
                                disabled={offerLoading}
                                className="bg-card border-border focus-visible:ring-primary text-foreground pl-10 h-12 text-lg shadow-sm"
                              />
                              <Clock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-border">
                          <Button
                            type="button"
                            onClick={() => {
                              if (interestRate > 0 && tenureMonths > 0) setOfferStep(1);
                              else toast.error('Interest rate and tenure must be positive numbers');
                            }}
                            className="bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer shadow-sm h-11 px-8"
                          >
                            Calculate Estimations &gt;
                          </Button>
                        </div>
                      </div>
                    )}

                    {offerStep === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        {/* Real-time EMI Calculator Panel */}
                        <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono border-b border-border pb-3">Estimation Review</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                              <span className="text-muted-foreground text-sm font-medium">Principal Amount</span>
                              <p className="font-bold text-xl text-foreground mt-1">{formatCurrency(app.loanAmount)}</p>
                            </div>
                            <div className="sm:border-l sm:border-border sm:pl-6">
                              <span className="text-muted-foreground text-sm font-medium">Estimated EMI</span>
                              <p className="font-extrabold text-primary mt-1 text-2xl">{formatCurrency(calculatedEmi)} <span className="text-xs text-muted-foreground font-mono font-normal tracking-wide">/ mo</span></p>
                            </div>
                            <div className="sm:border-l sm:border-border sm:pl-6">
                              <span className="text-muted-foreground text-sm font-medium">Total Repayment</span>
                              <p className="font-bold text-xl text-foreground mt-1">{formatCurrency(calculatedTotalRepayment)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                          <Button
                            type="button"
                            onClick={() => setOfferStep(0)}
                            disabled={offerLoading}
                            variant="outline"
                            className="flex-1 shadow-sm border-border bg-card hover:bg-muted text-foreground cursor-pointer h-12"
                          >
                            &lt; Back to Terms
                          </Button>
                          <Button
                            type="submit"
                            disabled={offerLoading || interestRate <= 0 || tenureMonths <= 0}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer h-12 text-base shadow-sm"
                          >
                            {offerLoading ? (
                              <>
                                <Clock className="h-5 w-5 mr-2 animate-spin" />
                                Generating Official Offer...
                              </>
                            ) : (
                              'Generate & Send Lending Offer'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Existing Offer Display */}
            {app.offer && (
              <Card className="border-border shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full pointer-events-none border-l border-b border-primary/10"></div>
                <CardHeader className="bg-muted/20 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Active Lending Offer
                    </CardTitle>
                    <CardDescription>Formal lending offer terms and schedule breakdown.</CardDescription>
                  </div>
                  <div>
                    {app.offer.offerStatus === 'GENERATED' && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-500/20 uppercase tracking-wider animate-pulse dark:bg-blue-500/20 dark:text-blue-400">
                        Generated & Pending Acceptance
                      </span>
                    )}
                    {app.offer.offerStatus === 'ACCEPTED' && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                        Offer Accepted by Client
                      </span>
                    )}
                    {app.offer.offerStatus === 'DECLINED' && (
                      <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-500/20 uppercase tracking-wider">
                        Offer Declined
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Principal Amount</span>
                      <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(app.offer.loanAmount)}</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Interest Rate</span>
                      <p className="text-2xl font-bold text-foreground mt-2">{app.offer.interestRate}% <span className="text-xs text-muted-foreground font-mono font-normal">p.a.</span></p>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Tenure</span>
                      <p className="text-2xl font-bold text-foreground mt-2">{app.offer.tenureMonths} <span className="text-xs text-muted-foreground font-mono font-normal">Months</span></p>
                    </div>
                    <div className="p-4 rounded-lg border shadow-sm bg-primary/5 border-primary/20">
                      <span className="text-primary text-xs uppercase tracking-wider font-bold">Monthly EMI</span>
                      <p className="text-2xl font-extrabold text-primary mt-2">{formatCurrency(app.offer.emiAmount)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm bg-muted/30 p-4 rounded-lg border border-border">
                    <div className="flex-1">
                      <span className="text-muted-foreground">Total Repayment Amount: </span>
                      <span className="font-bold text-foreground ml-1">{formatCurrency(app.offer.emiAmount * app.offer.tenureMonths)}</span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-border"></div>
                    <div className="flex items-center gap-4 text-muted-foreground font-mono text-xs">
                      <div>Gen: {new Date(app.offer.generatedAt).toLocaleDateString()}</div>
                      <div className={new Date() > new Date(app.offer.expiresAt) ? 'text-rose-500 font-bold' : ''}>
                        Exp: {new Date(app.offer.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Record customer acceptance workflow inside the card for Loan Officers / Super Admins */}
                  {app.status === 'OFFER_GENERATED' && user && (user.role === 'LOAN_OFFICER' || user.role === 'SUPER_ADMIN') && (
                    <div className="border-t border-border pt-6">
                      <Button
                        onClick={handleRecordCustomerAcceptance}
                        disabled={actionLoading || new Date() > new Date(app.offer.expiresAt)}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm h-12 px-8"
                      >
                        {actionLoading ? 'Recording...' : 'Acknowledge Customer Acceptance'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DISBURSEMENT TAB */}
          <TabsContent value="disbursement" className="m-0 space-y-6">
            {!app.disbursement && app.status !== 'OFFER_ACCEPTED' && (
              <Card className="border-border shadow-sm border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-foreground mb-1">Disbursement Not Available</p>
                  <p className="text-sm max-w-md mx-auto">The loan offer must be generated and accepted by the applicant before funds can be disbursed.</p>
                </CardContent>
              </Card>
            )}

            {/* Pending Disbursement Action */}
            {app.status === 'OFFER_ACCEPTED' && !app.disbursement && user && (user.role === 'APPROVER' || user.role === 'SUPER_ADMIN') && (
              <Card className="shadow-sm border-purple-500/30">
                <CardHeader className="bg-purple-500/5 border-b border-purple-500/20 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <DollarSign className="h-5 w-5" />
                    Fund Disbursement Workspace
                  </CardTitle>
                  <CardDescription>Review final details and execute payout transaction.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border p-6 rounded-xl shadow-sm">
                    <div>
                      <span className="text-muted-foreground text-sm font-medium">Approved Payout Amount</span>
                      <p className="font-extrabold text-3xl text-emerald-600 mt-2">{formatCurrency(app.loanAmount)}</p>
                    </div>
                    <div className="md:border-l md:border-border md:pl-6">
                      <span className="text-muted-foreground text-sm font-medium">Beneficiary Account Name</span>
                      <p className="font-bold text-xl text-foreground mt-2">{app.applicantName}</p>
                      <p className="text-sm text-muted-foreground font-mono mt-1">Application: {app.applicationNumber}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleDisburseLoan}
                    disabled={disburseLoading}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer h-14 text-lg shadow-md"
                  >
                    {disburseLoading ? (
                      <>
                        <Clock className="h-6 w-6 mr-3 animate-spin" />
                        Processing Secure Transfer...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-6 w-6 mr-2" />
                        Confirm & Release Funds
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Disbursed State */}
            {app.disbursement && (
              <Card className="border-border shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/5 rounded-bl-full pointer-events-none border-l border-b border-purple-500/10"></div>
                <CardHeader className="bg-muted/20 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 bg-purple-500/10 rounded-full p-0.5" />
                      Disbursement Record
                    </CardTitle>
                    <CardDescription>Transaction clearance reference and payout details.</CardDescription>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-500/20 font-mono uppercase tracking-wider dark:text-purple-400">
                      {app.disbursement.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Cleared Amount</span>
                      <p className="font-extrabold text-3xl text-foreground mt-2">{formatCurrency(app.disbursement.amount)}</p>
                    </div>
                    <div className="p-5 rounded-xl border border-border shadow-sm bg-muted/10">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Transaction Reference ID</span>
                      <div className="mt-3 flex items-center">
                        <span className="font-mono font-bold text-lg text-primary tracking-widest bg-card px-3 py-1.5 border border-border rounded-md shadow-sm select-all">
                          {app.disbursement.referenceNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-500" />
                      <span>Authorized by:</span>
                      <span className="font-semibold text-foreground">
                        {app.disbursement.disbursedBy ? `${app.disbursement.disbursedBy.firstName} ${app.disbursement.disbursedBy.lastName}` : 'System'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span className="font-mono text-foreground font-medium">
                        {new Date(app.disbursement.disbursedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AUDIT TIMELINE TAB */}
          <TabsContent value="audit" className="m-0 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-muted/20 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Application Lifecycle Audit
                </CardTitle>
                <CardDescription>Immutable record of status changes and key actions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 pb-10 px-8">
                <div className="relative pl-8 space-y-10 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {combinedTimeline.map((evt, idx) => {
                    const isNewest = idx === 0;
                    return (
                      <div key={evt.id || idx} className="relative">
                        {/* Node Icon */}
                        <span className={`absolute left-[-29px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 ${isNewest
                            ? 'bg-primary border-primary ring-4 ring-primary/20'
                            : 'bg-card border-muted-foreground/30'
                          }`}>
                          {isNewest && <span className="h-2 w-2 rounded-full bg-primary-foreground"></span>}
                        </span>

                        {/* Content */}
                        <div className="space-y-2 bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md tracking-wider ${evt.badgeColor}`}>
                              {evt.title}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded border border-border">
                              {new Date(evt.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="pt-1 space-y-3">
                            <p className="text-sm text-foreground font-medium">{evt.description}</p>

                            {evt.changedBy && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-full border border-border/50">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-semibold text-foreground">
                                  {evt.changedBy.firstName} {evt.changedBy.lastName}
                                </span>
                                <span className="mx-1 opacity-50">•</span>
                                <span className="font-mono uppercase tracking-wider">
                                  {evt.changedBy.role.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b shrink-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-10">
            <DialogTitle className="text-lg font-semibold truncate pr-6">{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-muted/20 relative overflow-hidden">
            {previewUrl && (
              previewUrl.toLowerCase().endsWith('.pdf') ? (
                <PdfViewer url={previewUrl} />
              ) : (
                <iframe 
                  src={previewUrl} 
                  className="absolute inset-0 w-full h-full border-0" 
                  title={previewTitle}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
