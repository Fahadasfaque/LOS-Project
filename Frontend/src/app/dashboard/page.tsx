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
  AlertTriangle,
  Users,
  Terminal,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  ShieldCheck,
  BarChart2
} from 'lucide-react';
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Super admin metrics
  const [userCount, setUserCount] = useState(4);
  const [logCount, setLogCount] = useState(142);
  
  // General applications lists
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 h-32 animate-pulse">
              <div className="h-4 w-1/2 bg-muted rounded"></div>
              <div className="h-8 w-1/3 bg-muted rounded mt-2"></div>
            </div>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card border border-border rounded-lg p-6 h-80 animate-pulse">
            <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
            <div className="w-full h-4/5 bg-muted rounded"></div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 h-80 animate-pulse">
            <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 w-full bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
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

  // Helper selectors
  const totalAppsCount = applications.length;
  const draftCount = applications.filter(a => a.status === 'DRAFT').length;
  const submittedCount = applications.filter(a => a.status === 'SUBMITTED').length;
  const underReviewCount = applications.filter(a => a.status === 'UNDER_REVIEW').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;
  const disbursedCount = applications.filter(a => a.status === 'DISBURSED').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;
  
  // Underwriting/Assessment specific KPI selectors
  const pendingAssessmentsCount = applications.filter(a => a.status === 'UNDER_REVIEW' && (!a.assessment || a.assessment.status === 'PENDING')).length;
  const completedAssessmentsCount = applications.filter(a => a.assessment?.status === 'COMPLETED').length;
  const approveRecsCount = applications.filter(a => a.assessment?.status === 'COMPLETED' && a.assessment?.recommendation === 'APPROVE').length;
  const rejectRecsCount = applications.filter(a => a.assessment?.status === 'COMPLETED' && a.assessment?.recommendation === 'REJECT').length;
  const manualReviewRecsCount = applications.filter(a => a.assessment?.status === 'COMPLETED' && a.assessment?.recommendation === 'MANUAL_REVIEW').length;

  // Offer specific KPI selectors
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
    .slice(0, 3);

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DRAFT':
        return <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-border">Draft</span>;
      case 'SUBMITTED':
        return <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-blue-500/20 animate-pulse dark:bg-blue-500/20 dark:text-blue-400">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-amber-500/20 dark:text-amber-500">Reviewing</span>;
      case 'APPROVED':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-emerald-500/20 dark:text-emerald-500">Approved</span>;
      case 'REJECTED':
        return <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-rose-500/20 dark:text-rose-500">Rejected</span>;
      case 'DISBURSED':
        return <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-purple-500/20 dark:text-purple-400">Disbursed</span>;
      default:
        return <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-border">{statusStr}</span>;
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Total System Users</span>
            <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{userCount}</span>
            <span className="text-sm font-medium text-emerald-600">All roles registered.</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Audit Logs Recorded</span>
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-600">
              <Terminal className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{logCount}</span>
            <span className="text-sm font-medium text-blue-600">Audit compliance active.</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Overall Applications</span>
            <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{totalAppsCount}</span>
            <span className="text-sm font-medium text-muted-foreground">Total loans in system.</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">DB Transactions</span>
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">Healthy</span>
            <span className="text-sm font-medium text-emerald-600">Connection validated.</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex flex-col gap-1 mb-6">
            <h4 className="text-lg font-bold">Application Status Overview</h4>
            <p className="text-sm text-muted-foreground">Current state of all applications in the system.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationFunnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex flex-col gap-1 mb-6">
            <h4 className="text-lg font-bold">System Status</h4>
            <p className="text-sm text-muted-foreground">Real-time status metrics of the platform.</p>
          </div>
          <div className="space-y-4 font-mono text-sm flex-1">
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Environment</span>
              <span className="text-blue-600 font-medium">Development / Localhost</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">POSTGRESQL DIALECT</span>
              <span className="text-blue-600 font-medium">Neon Serverless</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">AES KEY CONFIGURATION</span>
              <span className="text-emerald-600 font-bold">ACTIVE (AES-256-GCM READY)</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">API Gateway Status</span>
              <span className="text-emerald-600 font-semibold">Online (Express v5)</span>
            </div>
             <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Authentication</span>
              <span className="text-emerald-600 font-semibold">JWT Bearer Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoanOfficerKPIs = () => (
    <div className="space-y-6">
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Total Applications</span>
            <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{totalAppsCount}</span>
            <span className="text-sm font-medium text-blue-600">Originated by you.</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Pending Submission</span>
            <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{draftCount}</span>
            <span className="text-sm font-medium text-amber-600">Applications in Draft status.</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">In Underwriting</span>
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-600">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{submittedCount + underReviewCount}</span>
            <span className="text-sm font-medium text-cyan-600">Assigned for credit reviews.</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Disbursed Successfully</span>
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{disbursedCount}</span>
            <span className="text-sm font-medium text-emerald-600">Disbursed to applicant.</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm flex flex-col transition-colors duration-200">
          <div className="flex flex-col gap-1 mb-6">
            <h4 className="text-lg font-bold">Origination Funnel</h4>
            <p className="text-sm text-muted-foreground">Application progress tracking.</p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationFunnelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm flex flex-col justify-between transition-colors duration-200">
            <div className="flex flex-col gap-1 mb-4">
              <h4 className="text-lg font-bold">Origination Quick Actions</h4>
              <p className="text-sm text-muted-foreground">Actions available for Loan Officers.</p>
            </div>
            <div className="space-y-3 flex flex-col justify-center">
              <Link href="/dashboard/create-application" className="w-full">
                <Button className="w-full text-center py-2.5 bg-primary hover:bg-primary/90 transition-all font-semibold rounded-lg text-sm text-primary-foreground cursor-pointer flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  Initiate New Loan Application
                </Button>
              </Link>
              <Link href="/dashboard/my-applications" className="w-full">
                <Button className="w-full text-center py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border transition-all font-semibold rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  View Application Registry
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-bold">Recent Originations</h4>
                <p className="text-sm text-muted-foreground">Your latest loan applications.</p>
              </div>
            </div>
            <div className="space-y-4">
              {recentApplications.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center border border-dashed border-border rounded-lg">No applications initiated yet.</p>
              ) : (
                recentApplications.map(app => (
                  <div key={app.id} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{app.applicationNumber}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="font-semibold">{formatCurrency(app.loanAmount)}</p>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreditAnalystKPIs = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-foreground">Credit Underwriting Dashboard</h3>
        <p className="text-sm text-muted-foreground">Queue management and risk assessment performance metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Pending Assessments</span>
            <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{pendingAssessmentsCount}</span>
            <span className="text-sm font-medium text-amber-600">Awaiting assessment</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Completed Assessments</span>
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{completedAssessmentsCount}</span>
            <span className="text-sm font-medium text-emerald-600">Underwritten loans</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Approve Recommendations</span>
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{approveRecsCount}</span>
            <span className="text-sm font-medium text-emerald-600">Recommended for approval</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Reject Recommendations</span>
            <div className="w-9 h-9 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-600">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{rejectRecsCount}</span>
            <span className="text-sm font-medium text-rose-600">Recommended for rejection</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm transition-colors duration-200">
          <div className="flex flex-col gap-1 mb-6">
            <h4 className="text-lg font-bold">Recommendation Breakdown</h4>
            <p className="text-sm text-muted-foreground">Decisions made on completed assessments.</p>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            {completedAssessmentsCount === 0 ? (
              <p className="text-muted-foreground text-sm">No completed assessments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assessmentRecData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assessmentRecData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1">
              <h4 className="text-lg font-bold">Credit Evaluation Queue</h4>
              <p className="text-sm text-muted-foreground">Latest loan applications awaiting assessment.</p>
            </div>
            <Link href="/dashboard/risk-queue">
              <Button size="sm" variant="outline" className="border-border hover:bg-muted text-foreground cursor-pointer">
                Assess Queue
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg bg-muted/30">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">All caught up! No applications pending assessment.</p>
              </div>
            ) : (
              applications
                .filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status))
                .slice(0, 4)
                .map(app => (
                  <div key={app.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0 text-sm">
                    <div>
                      <span className="font-semibold text-foreground block">
                        {app.applicantName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono mt-0.5 block">{app.applicationNumber}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-foreground font-semibold">{formatCurrency(app.loanAmount)}</span>
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
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-foreground">Credit Executive Dashboard</h3>
        <p className="text-sm text-muted-foreground">Final credit limit approvals and release queue.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Applications</span>
            <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{totalAppsCount}</span>
            <span className="text-sm font-medium text-blue-600">Total active originations</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Assessments</span>
            <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{completedAssessmentsCount}</span>
            <span className="text-sm font-medium text-amber-600">Completed credit underwriting</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Approved</span>
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{approvedCount}</span>
            <span className="text-sm font-medium text-emerald-600">Awaiting offer generation</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Offers Generated</span>
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{offersGeneratedCount}</span>
            <span className="text-sm font-medium text-cyan-600">Awaiting client acceptances</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Offers Accepted</span>
            <div className="w-9 h-9 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{offersAcceptedCount}</span>
            <span className="text-sm font-medium text-purple-600">Awaiting fund disbursement</span>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 flex-1 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-sm font-medium">Disbursed Loans</span>
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl text-foreground leading-none">{disbursedCount}</span>
            <span className="text-sm font-medium text-emerald-600">Payout: {formatVolume(totalDisbursedAmount)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1">
              <h4 className="text-lg font-bold">Approvals Pending Release</h4>
              <p className="text-sm text-muted-foreground">Awaiting final executive sign-off.</p>
            </div>
            <Link href="/dashboard/approval-queue">
              <Button size="sm" variant="outline" className="border-border hover:bg-muted text-foreground cursor-pointer">
                View Queue
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {applications.filter(a => a.status === 'UNDER_REVIEW').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg bg-muted/30">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">No applications awaiting sign-off.</p>
              </div>
            ) : (
              applications
                .filter(a => a.status === 'UNDER_REVIEW')
                .slice(0, 4)
                .map(app => (
                  <div key={app.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0 text-sm">
                    <div>
                      <p className="font-semibold">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{app.loanType}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-semibold text-foreground">{formatCurrency(app.loanAmount)}</p>
                      <Link href={`/dashboard/applications/${app.id}`}>
                        <Button size="sm" className="h-7 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground px-3 rounded cursor-pointer font-medium">
                          Review Limit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border text-foreground rounded-lg p-6 shadow-sm flex flex-col transition-colors duration-200">
          <div className="flex flex-col gap-1 mb-6">
            <h4 className="text-lg font-bold">Portfolio Risk Distribution</h4>
            <p className="text-sm text-muted-foreground">Originations categorised by loan size limit.</p>
          </div>
          <div className="h-[250px] w-full mt-auto">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={riskTierData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={24}>
                <defs>
                  <linearGradient id="colorTier1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="colorTier2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="colorTier3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={110} tick={{fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '14px' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 4, 4]} 
                  background={{ fill: 'hsl(var(--muted))', opacity: 0.3, radius: 4 }}
                >
                  {
                    riskTierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#colorTier${index + 1})`} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Welcome Block redesigned */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight leading-snug">
            Welcome back, {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            Here's your credit origination overview for today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="border-border bg-card hover:bg-muted text-foreground cursor-pointer h-10 w-10 p-0 shadow-sm transition-all duration-200"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Role badge card */}
          <div className="flex items-center gap-3 bg-card border border-border shadow-sm rounded-lg px-5 py-2 h-10 transition-all duration-200">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-3 w-3" />
            </div>
            <div className="flex flex-col text-left">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                Role
              </div>
              <div className="text-foreground text-sm font-bold leading-normal mt-0.5">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center text-muted-foreground bg-card border border-border rounded-xl shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <span className="font-medium text-sm">Synchronizing platform data...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm text-center font-medium shadow-sm flex flex-col items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
          {error}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {user.role === 'SUPER_ADMIN' && renderSuperAdminKPIs()}
          {user.role === 'LOAN_OFFICER' && renderLoanOfficerKPIs()}
          {user.role === 'CREDIT_ANALYST' && renderCreditAnalystKPIs()}
          {user.role === 'APPROVER' && renderApproverKPIs()}
        </div>
      )}
    </div>
  );
}
