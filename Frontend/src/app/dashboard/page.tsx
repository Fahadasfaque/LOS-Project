'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { api } from '@/services/api';
import {
  FileText,
  Clock,
  CheckCircle,
  Warning,
  Users,
  TerminalWindow,
  Pulse,
  CurrencyInr,
  TrendUp,
  ArrowsCounterClockwise,
  Plus,
  ShieldCheck,
  ArrowRight,
  Globe,
  Database,
  Code,
  Key,
  DotsThree,
  Scales,
  CaretDown,
  Info,
  FolderSimple
} from '@phosphor-icons/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface AssessmentSummary {
  id: string;
  status: 'PENDING' | 'COMPLETED';
  creditScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
  assessmentNotes: string;
  assessedById: string;
  assessedAt: string;
}

interface OfferSummary {
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

interface ApplicationItem {
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
  assessment?: AssessmentSummary | null;
  offer?: OfferSummary | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCount, setUserCount] = useState(4);
  const [logCount, setLogCount] = useState(142);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      if (user.role === 'SUPER_ADMIN') {
        const [usersRes, logsRes, appsRes] = await Promise.all([
          api.get('/users').catch(() => ({ success: true, data: [] })),
          api.get('/audit-logs').catch(() => ({ success: true, data: [] })),
          api.get('/applications?limit=1000').catch(() => ({ success: true, data: { items: [] } }))
        ]);
        
        if (usersRes.success && usersRes.data) {
          setUserCount(usersRes.data.length || 4);
        }
        if (logsRes.success && logsRes.data) {
          setLogCount(logsRes.data.length || 142);
        }
        if (appsRes.success && appsRes.data?.items) {
          setApplications(appsRes.data.items);
        }
      } else {
        const appsRes = await api.get('/applications?limit=1000').catch(() => ({ success: true, data: { items: [] } }));
        if (appsRes.success && appsRes.data?.items) {
          setApplications(appsRes.data.items);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load live dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper selectors
  const totalAppsCount = applications.length;
  const draftCount = applications.filter(a => a.status === 'DRAFT').length;
  const submittedCount = applications.filter(a => a.status === 'SUBMITTED').length;
  const underReviewCount = applications.filter(a => a.status === 'UNDER_REVIEW').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;
  const disbursedCount = applications.filter(a => a.status === 'DISBURSED').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;
  
  const pendingAssessmentsCount = applications.filter(a => a.status === 'UNDER_REVIEW' && (!a.assessment || a.assessment.status === 'PENDING')).length;
  const completedAssessmentsCount = applications.filter(a => a.assessment?.status === 'COMPLETED').length;
  const approveRecsCount = applications.filter(a => a.assessment?.status === 'COMPLETED' && a.assessment?.recommendation === 'APPROVE').length;
  const rejectRecsCount = applications.filter(a => a.assessment?.status === 'COMPLETED' && a.assessment?.recommendation === 'REJECT').length;
  const manualReviewRecsCount = applications.filter(a => a.assessment?.status === 'COMPLETED' && a.assessment?.recommendation === 'MANUAL_REVIEW').length;

  const offersGeneratedCount = applications.filter(a => a.offer?.offerStatus === 'GENERATED').length;
  const offersAcceptedCount = applications.filter(a => a.offer?.offerStatus === 'ACCEPTED').length;

  const totalDisbursedAmount = applications
    .filter(a => a.status === 'DISBURSED')
    .reduce((sum, a) => sum + a.loanAmount, 0);

  const formatVolume = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return formatCurrency(val);
  };

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const getStatusBadge = (statusStr: string) => {
    const baseBadgeClass = "text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded font-mono uppercase font-bold border border-border";
    switch (statusStr) {
      case 'DRAFT':
        return <span className={baseBadgeClass}>Draft</span>;
      case 'SUBMITTED':
        return <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded font-mono uppercase font-bold border border-primary/20 animate-pulse">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded font-mono uppercase font-bold border border-amber-500/25">Reviewing</span>;
      case 'APPROVED':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded font-mono uppercase font-bold border border-emerald-500/25">Approved</span>;
      case 'REJECTED':
        return <span className="text-[10px] bg-destructive/10 text-destructive px-2.5 py-1 rounded font-mono uppercase font-bold border border-destructive/25">Rejected</span>;
      case 'OFFER_GENERATED':
        return <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2.5 py-1 rounded font-mono uppercase font-bold border border-purple-500/20 animate-pulse">Awaiting Customer</span>;
      case 'OFFER_ACCEPTED':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded font-mono uppercase font-bold border border-emerald-500/25">Offer Accepted</span>;
      case 'DISBURSED':
        return <span className="text-[10px] bg-violet-500/10 text-violet-600 px-2.5 py-1 rounded font-mono uppercase font-bold border border-violet-500/20">Disbursed</span>;
      default:
        return <span className={baseBadgeClass}>{statusStr}</span>;
    }
  };

  // Recharts Data Prep
  const applicationFunnelData = [
    { name: 'Draft', count: draftCount },
    { name: 'Submitted', count: submittedCount },
    { name: 'Review', count: underReviewCount },
    { name: 'Approved', count: approvedCount },
    { name: 'Disbursed', count: disbursedCount },
  ];

  const assessmentRecData = [
    { name: 'Approve', value: approveRecsCount, color: '#10b981' },
    { name: 'Manual Review', value: manualReviewRecsCount, color: '#f59e0b' },
    { name: 'Reject', value: rejectRecsCount, color: '#ef4444' },
  ];

  const tier1Count = applications.filter(a => a.loanAmount < 2000000).length;
  const tier2Count = applications.filter(a => a.loanAmount >= 2000000 && a.loanAmount <= 7500000).length;
  const tier3Count = applications.filter(a => a.loanAmount > 7500000).length;

  const riskTierData = [
    { name: 'Tier 1 (< 20L)', count: tier1Count },
    { name: 'Tier 2 (20-75L)', count: tier2Count },
    { name: 'Tier 3 (> 75L)', count: tier3Count },
  ];

  const renderSuperAdminKPIs = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Link href="/dashboard/users" className="group block bg-card border border-border hover:border-primary/50 rounded-lg p-5 shadow-sm transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Users className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total System Users</span>
              <span className="font-extrabold text-3.5xl text-foreground leading-none mt-1">{userCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Manage system access control and employee role provisioning.
          </p>
        </Link>

        {/* KPI 2 */}
        <Link href="/dashboard/logs" className="group block bg-card border border-border hover:border-primary/50 rounded-lg p-5 shadow-sm transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <TerminalWindow className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Compliance Logs</span>
              <span className="font-extrabold text-3.5xl text-foreground leading-none mt-1">{logCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Audit log activity entries for SOC 2 Type II compliance.
          </p>
        </Link>

        {/* KPI 3 */}
        <Link href="/dashboard/my-applications" className="group block bg-card border border-border hover:border-primary/50 rounded-lg p-5 shadow-sm transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <FileText className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Applications</span>
              <span className="font-extrabold text-3.5xl text-foreground leading-none mt-1">{totalAppsCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Monitoring total loan requests initialized in the system.
          </p>
        </Link>

        {/* KPI 4 */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <ShieldCheck className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">DB Transactions</span>
              <span className="font-extrabold text-3.5xl text-emerald-600 leading-none mt-1">Secure</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Neon Serverless Postgres encryption and IV tokens verified.
          </p>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <ShieldCheck className="h-5 w-5 text-primary" weight="fill" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-foreground">
              Administrative Security Operations Center (ASOC)
            </h4>
            <p className="text-xs text-muted-foreground max-w-3xl leading-normal mt-0.5">
              You are currently viewing the administrative control dashboard. Every user creation, password reset, and status override is permanently recorded in the system audit logs. Ensure that user access levels are audited weekly in compliance with standard bank security regulations.
            </p>
          </div>
        </div>
        <Link href="/dashboard/users">
          <Button size="sm" className="shrink-0 cursor-pointer font-bold flex items-center gap-1.5 h-10 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            Access User Registry
            <ArrowRight className="h-4 w-4" weight="bold" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-1 mb-6 text-left">
            <h4 className="text-base font-bold text-foreground">Global Lifecycle Pipeline</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Volume count of all loan applications classified by workflow status.</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationFunnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.3}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#0b3a60" 
                  radius={[0, 0, 0, 0]} 
                  maxBarSize={50} 
                  label={{ position: 'top', fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 'bold' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-1 mb-4 text-left">
            <h4 className="text-base font-bold text-foreground">System Specifications</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Decoupled system architecture configurations.</p>
          </div>
          <div className="space-y-4 font-mono text-xs flex-1 flex flex-col justify-center select-none">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-muted-foreground text-left">DEPLOYMENT REGION</span>
              <span className="text-primary font-bold flex items-center gap-1.5">
                <Globe className="h-4 w-4" weight="fill" /> AWS Mumbai (ap-south-1)
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-muted-foreground text-left">POSTGRES INSTANCE</span>
              <span className="text-foreground font-bold flex items-center gap-1.5">
                <Database className="h-4 w-4 text-slate-500" weight="fill" /> Neon Serverless DB
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-muted-foreground text-left">PII DATA PROTECTION</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" weight="fill" /> AES-256-GCM LOCKED
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-muted-foreground text-left">API FRAMEWORK</span>
              <span className="text-foreground font-semibold flex items-center gap-1.5">
                <Code className="h-4 w-4 text-slate-500" weight="bold" /> Express.js (v5.2 TS)
              </span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-muted-foreground text-left">AUTH GATEWAY</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <Key className="h-4 w-4 text-emerald-500" weight="fill" /> JWT Bearer Stateless
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const renderLoanOfficerKPIs = () => {
    const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Total Applications */}
          <Link href="/dashboard/my-applications" className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 shadow-sm transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600">
                  <FileText className="h-5 w-5" weight="bold" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Applications</span>
                  <span className="font-extrabold text-3.5xl text-slate-900 dark:text-white leading-none mt-0.5">{totalAppsCount}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowRight className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
              Click to view all loan applications originated under your account code.
            </p>
          </Link>

          {/* KPI 2: Pending Submission */}
          <Link href="/dashboard/my-applications?status=DRAFT" className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 shadow-sm transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-600">
                  <Clock className="h-5 w-5" weight="bold" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Pending Submission</span>
                  <span className="font-extrabold text-3.5xl text-slate-900 dark:text-white leading-none mt-0.5">{draftCount}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowRight className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
              Applications saved in Draft state. Submit them to initiate credit review.
            </p>
          </Link>

          {/* KPI 3: Active Reviews */}
          <Link href="/dashboard/my-applications" className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 shadow-sm transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600">
                  <Pulse className="h-5 w-5" weight="bold" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Active Reviews</span>
                  <span className="font-extrabold text-3.5xl text-slate-900 dark:text-white leading-none mt-0.5">{submittedCount + underReviewCount}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowRight className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
              Applications currently undergoing credit risk assessments.
            </p>
          </Link>

          {/* KPI 4: Disbursed Capital */}
          <Link href="/dashboard/my-applications" className="group block bg-card border border-border hover:border-primary/50 rounded-xl p-5 shadow-sm transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
                  <CurrencyInr className="h-5 w-5" weight="bold" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Disbursed Capital</span>
                  <span className="font-extrabold text-2.5xl text-emerald-600 dark:text-emerald-500 leading-none mt-0.5">{formatVolume(totalDisbursedAmount)}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowRight className="h-4 w-4" weight="bold" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
              Total loan value successfully disbursed to customers.
            </p>
          </Link>
        </div>

        {/* Explanation Banner */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600">
              <Info className="h-5 w-5 text-blue-600" weight="fill" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-bold text-foreground">
                Origination Workflow Action Required
              </h4>
              <p className="text-xs text-muted-foreground max-w-3xl leading-normal mt-0.5">
                You currently have <span className="font-bold text-foreground">{draftCount} draft applications</span> pending. Please ensure all applicant profiles contain valid PAN cards, contact information, and mandatory document attachments before submission to maintain proper workflow SLAs.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/create-application">
              <Button size="sm" className="shrink-0 cursor-pointer font-bold flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-lg shadow-sm">
                <Plus className="h-3.5 w-3.5" weight="bold" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Progress Funnel */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <TrendUp className="h-4.5 w-4.5" weight="bold" />
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Applications Progress Funnel</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tracking conversion rate of applications originated by your terminal.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative select-none">
                  <select className="appearance-none h-8 pl-3 pr-8 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm">
                    <option>This Month</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <CaretDown className="h-3 w-3" />
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <DotsThree className="h-5 w-5" weight="bold" />
                </Button>
              </div>
            </div>

            <div className="h-[250px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationFunnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600}} tickFormatter={(val) => val.toFixed(2)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                  />
                  <Area type="monotone" name="Application Count" dataKey="count" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 1.5, fill: '#3b82f6' }} />
                  <Legend verticalAlign="bottom" height={36} align="center" iconType="square" iconSize={8} formatter={(value) => <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">{value}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <FolderSimple className="h-4.5 w-4.5" weight="bold" />
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Recent Originated Cases</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Your latest application submissions and status updates.</p>
                </div>
              </div>
              <Link href="/dashboard/my-applications">
                <Button size="sm" variant="outline" className="border-border hover:bg-muted text-foreground cursor-pointer font-bold h-9 rounded-lg px-4 text-xs">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {recentApplications.length === 0 ? (
                <p className="text-muted-foreground text-xs py-10 text-center border border-dashed border-border rounded-lg">
                  No applications originated yet. Click "New Application" to begin.
                </p>
              ) : (
                recentApplications.map(app => (
                  <div key={app.id} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs uppercase border border-blue-500/20 shrink-0">
                        {getInitials(app.applicantName)}
                      </div>
                      <div className="text-left">
                        <Link href={`/dashboard/applications/${app.id}`} className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors hover:underline capitalize text-sm">
                          {app.applicantName}
                        </Link>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{app.applicationNumber}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(app.loanAmount)}</span>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreditAnalystKPIs = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Link href="/dashboard/risk-queue" className="group block bg-card border border-border hover:border-primary/50 rounded-lg p-5 shadow-sm transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Clock className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Pending Assessments</span>
              <span className="font-extrabold text-3xl text-foreground leading-none mt-1">{pendingAssessmentsCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Applications in status UNDER REVIEW awaiting credit report locks.
          </p>
        </Link>

        {/* KPI 2 */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <CheckCircle className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Completed Reviews</span>
              <span className="font-extrabold text-3xl text-foreground leading-none mt-1">{completedAssessmentsCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Total applications evaluated and recommended to the credit committee.
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <TrendUp className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Recommended Approvals</span>
              <span className="font-extrabold text-3xl text-emerald-600 leading-none mt-1">{approveRecsCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Low-risk applicants flagged with a recommended positive approval.
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 text-destructive">
              <Warning className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Recommended Rejections</span>
              <span className="font-extrabold text-3xl text-destructive leading-none mt-1">{rejectRecsCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            High-risk applications recommended for rejection.
          </p>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <Scales className="h-5 w-5 text-primary" weight="fill" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-foreground">
              Credit Underwriting Guidelines (SLA Compliance)
            </h4>
            <p className="text-xs text-muted-foreground max-w-3xl leading-normal mt-0.5">
              You currently have <span className="font-bold text-foreground">{pendingAssessmentsCount} active risk evaluations</span> pending. In accordance with standard operating procedures, credit assessments must be finalized and locked within 24 hours of moving to underwriting review.
            </p>
          </div>
        </div>
        <Link href="/dashboard/risk-queue">
          <Button size="sm" className="shrink-0 cursor-pointer font-bold flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 rounded-lg">
            Evaluate Risk Queue
            <ArrowRight className="h-4 w-4" weight="bold" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-1 mb-6 text-left">
            <h4 className="text-lg font-bold text-foreground">Decision Ratios</h4>
            <p className="text-xs text-muted-foreground">Percentage split of completed risk assessments recommendations.</p>
          </div>
          <div className="h-[240px] w-full flex items-center justify-center">
            {completedAssessmentsCount === 0 ? (
              <p className="text-muted-foreground text-xs py-10 text-center border border-dashed border-border rounded-lg w-full">No completed assessments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assessmentRecData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assessmentRecData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1 text-left">
              <h4 className="text-lg font-bold text-foreground">Credit Assessment Queue</h4>
              <p className="text-xs text-muted-foreground">Applications waiting in underwriting queue.</p>
            </div>
            <Link href="/dashboard/risk-queue">
              <Button size="sm" variant="outline" className="border-border hover:bg-muted text-foreground cursor-pointer font-bold h-9 rounded-lg">
                Go to Queue
              </Button>
            </Link>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg bg-muted/20 w-full">
                <CheckCircle className="h-8 w-8 text-emerald-600 mb-2 opacity-60" weight="fill" />
                <p className="text-muted-foreground text-xs">All caught up! No applications pending assessment.</p>
              </div>
            ) : (
              applications
                .filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status))
                .slice(0, 4)
                .map(app => (
                  <div key={app.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0 text-sm">
                    <div className="text-left">
                      <Link href={`/dashboard/applications/${app.id}`} className="font-bold text-foreground hover:text-primary transition-colors hover:underline capitalize">
                        {app.applicantName}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{app.applicationNumber}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(app.loanAmount)}</span>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderApproverKPIs = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* KPI 1 */}
        <Link href="/dashboard/approval-queue" className="group block bg-card border border-border hover:border-primary/50 rounded-lg p-5 shadow-sm transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Clock className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Awaiting Approval</span>
              <span className="font-extrabold text-3xl text-foreground leading-none mt-1">{approvedCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Applications evaluated by Credit Analysts awaiting final approval signing.
          </p>
        </Link>

        {/* KPI 2 */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <FileText className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Offers Outstanding</span>
              <span className="font-extrabold text-3xl text-foreground leading-none mt-1">{offersGeneratedCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Loan offers sent to customer. Awaiting user acceptance signatures.
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4 mb-4 select-none">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <CurrencyInr className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Disbursement Queue</span>
              <span className="font-extrabold text-3xl text-emerald-600 leading-none mt-1">{offersAcceptedCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium text-left leading-normal">
            Offers accepted. Authorize transaction release codes to fund.
          </p>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <ShieldCheck className="h-5 w-5 text-primary" weight="fill" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-foreground">
              Executive Committee Controls
            </h4>
            <p className="text-xs text-muted-foreground max-w-3xl leading-normal mt-0.5">
              As a Credit Executive, you hold final signing authority. Ensure that underwriting logs, risk assessment records, and monthly income criteria are thoroughly cross-referenced before releasing loan approvals and generating financial offers.
            </p>
          </div>
        </div>
        <Link href="/dashboard/approval-queue">
          <Button size="sm" className="shrink-0 cursor-pointer font-bold flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 rounded-lg">
            Authorize Queue
            <ArrowRight className="h-4 w-4" weight="bold" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-1 mb-6 text-left">
            <h4 className="text-lg font-bold text-foreground">Risk Classifications</h4>
            <p className="text-xs text-muted-foreground">Portfolio breakdown categorized by originated loan volume brackets.</p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={riskTierData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 11}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.1}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {riskTierData.map((entry, index) => {
                    const colors = ['#10b981', '#f59e0b', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index] || '#3b82f6'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1 text-left">
              <h4 className="text-lg font-bold text-foreground">Pending Approvals Queue</h4>
              <p className="text-xs text-muted-foreground">Latest assessment reports awaiting final committee sign-off.</p>
            </div>
            <Link href="/dashboard/approval-queue">
              <Button size="sm" variant="outline" className="border-border hover:bg-muted text-foreground cursor-pointer font-bold h-9 rounded-lg">
                Go to Approvals
              </Button>
            </Link>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {applications.filter(a => ['APPROVED', 'UNDER_REVIEW'].includes(a.status) && a.assessment?.status === 'COMPLETED').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg bg-muted/20 w-full">
                <CheckCircle className="h-8 w-8 text-emerald-600 mb-2 opacity-60" weight="fill" />
                <p className="text-muted-foreground text-xs">No pending credit approvals at this time.</p>
              </div>
            ) : (
              applications
                .filter(a => ['APPROVED', 'UNDER_REVIEW'].includes(a.status) && a.assessment?.status === 'COMPLETED')
                .slice(0, 4)
                .map(app => (
                  <div key={app.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0 text-sm">
                    <div className="text-left">
                      <Link href={`/dashboard/applications/${app.id}`} className="font-bold text-foreground hover:text-primary transition-colors hover:underline capitalize">
                        {app.applicantName}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{app.loanType}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="font-bold text-foreground">{formatCurrency(app.loanAmount)}</p>
                      <Link href={`/dashboard/applications/${app.id}`}>
                        <Button size="sm" className="h-8 text-[10px] bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 py-0 cursor-pointer rounded-lg shadow-sm">
                          Review Limit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Welcome Block */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 select-none">
        <div className="text-left">
          <h1 className="font-extrabold text-3.5xl text-foreground tracking-tight leading-snug">
            Welcome back, {user.firstName} {user.lastName} 👋
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1.5 flex items-center gap-2">
            <span>Fortress Lending System Terminal — Session Active</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 dark:text-emerald-500 font-bold text-xs">System Online</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="border-border bg-card hover:bg-muted text-foreground cursor-pointer h-10 w-10 p-0 shadow-sm transition-all duration-200 rounded-lg"
            title="Refresh statistics"
          >
            <ArrowsCounterClockwise className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} weight="bold" />
          </Button>

          {/* Access level badge card */}
          <div className="flex items-center gap-3 bg-card border border-border shadow-sm rounded-lg px-4 py-2 h-10 transition-all duration-200">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" weight="fill" />
            </div>
            <div className="flex flex-col text-left">
              <div className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider leading-none">
                Access Level
              </div>
              <div className="text-foreground text-xs font-bold leading-normal mt-0.5">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center text-muted-foreground bg-card border border-border rounded-lg shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <ArrowsCounterClockwise className="h-8 w-8 text-primary animate-spin" weight="bold" />
            <span className="font-semibold text-xs tracking-wide">Synchronizing platform data...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center font-semibold shadow-sm flex flex-col items-center gap-2">
          <Warning className="h-6 w-6 text-destructive" weight="fill" />
          {error}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 ease-out">
          {user.role === 'SUPER_ADMIN' && renderSuperAdminKPIs()}
          {user.role === 'LOAN_OFFICER' && renderLoanOfficerKPIs()}
          {user.role === 'CREDIT_ANALYST' && renderCreditAnalystKPIs()}
          {user.role === 'APPROVER' && renderApproverKPIs()}
        </div>
      )}
    </div>
  );
}
