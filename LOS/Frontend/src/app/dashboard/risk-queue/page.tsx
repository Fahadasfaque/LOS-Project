'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShieldWarning,
  MagnifyingGlass,
  ArrowsCounterClockwise,
  CaretLeft,
  CaretRight,
  Eye,
  DownloadSimple,
  Funnel,
  FileText,
  Warning,
  CircleNotch,
  Calendar,
  Phone,
  EnvelopeSimple,
  CurrencyInr,
  Briefcase,
  UserCheck,
  CheckCircle,
  Users
} from '@phosphor-icons/react';

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
}

export default function RiskQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('SUBMITTED'); // Default to SUBMITTED for risk assessment
  const [loanType, setLoanType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // States for overall counts across the system
  const [allApps, setAllApps] = useState<ApplicationItem[]>([]);

  const fetchOverviewStats = async () => {
    try {
      const res = await api.get('/applications?limit=1000');
      if (res.success && res.data?.items) {
        setAllApps(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load overview stats', err);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      if (loanType) queryParams.append('loanType', loanType);
      queryParams.append('page', String(page));
      queryParams.append('limit', String(limit));

      const res = await api.get(`/applications?${queryParams.toString()}`);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchOverviewStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, loanType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('SUBMITTED');
    setLoanType('');
    setPage(1);
  };

  // Compute counters from full list
  const statPending = allApps.filter(a => a.status === 'SUBMITTED').length;
  const statReview = allApps.filter(a => a.status === 'UNDER_REVIEW').length;
  const statApproved = allApps.filter(a => a.status === 'APPROVED').length;
  const statRejected = allApps.filter(a => a.status === 'REJECTED').length;

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DRAFT':
        return <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-350 dark:border-slate-700/50 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Draft</span>;
      case 'SUBMITTED':
        return <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase animate-pulse">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Reviewing</span>;
      case 'APPROVED':
        return <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Approved</span>;
      case 'REJECTED':
        return <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Rejected</span>;
      case 'DISBURSED':
        return <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/30 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">Disbursed</span>;
      default:
        return <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded font-mono font-bold tracking-wide uppercase">{statusStr.replace('_', ' ')}</span>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const downloadCSV = () => {
    const headers = ['Application No.', 'Applicant Name', 'Loan Type', 'Loan Amount', 'Monthly Income', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.applicationNumber,
        `"${item.applicantName}"`,
        item.loanType,
        item.loanAmount,
        item.monthlyIncome,
        item.status,
        new Date(item.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risk_queue_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6 w-full pb-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="font-semibold text-2xl text-foreground leading-snug tracking-tight flex items-center gap-2">
            Risk Assessment Queue
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Underwrite loan applications, evaluate documents, and transition statuses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-border bg-card text-slate-700 dark:text-slate-350 hover:bg-muted cursor-pointer shadow-sm h-9 px-4 transition-all duration-150 font-semibold flex items-center gap-1.5 rounded-lg text-xs"
            onClick={downloadCSV}
          >
            <DownloadSimple className="h-4 w-4" weight="bold" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="h-5 w-5" weight="bold" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Awaiting Assessment</span>
            <span className="font-bold text-lg text-foreground leading-tight">{statPending}</span>
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
            <ShieldWarning className="h-5 w-5" weight="bold" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Under Review</span>
            <span className="font-bold text-lg text-foreground leading-tight">{statReview}</span>
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-550 shrink-0">
            <CheckCircle className="h-5 w-5" weight="bold" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Total Approved</span>
            <span className="font-bold text-lg text-foreground leading-tight">{statApproved}</span>
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200 select-none">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 shrink-0">
            <Warning className="h-5 w-5" weight="bold" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Total Rejected</span>
            <span className="font-bold text-lg text-foreground leading-tight">{statRejected}</span>
          </div>
        </div>
      </div>

      {/* Inline Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Applicant Name, App Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 bg-background border-border text-foreground placeholder-muted-foreground shadow-none rounded-md w-full text-xs"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto scrollbar-none">
          {/* Status Select */}
          <Select value={status || 'all'} onValueChange={(val) => { setStatus(val === 'all' || !val ? '' : val); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs border-border bg-background w-48">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-foreground z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted (Pending Action)</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="OFFER_GENERATED">Awaiting Customer</SelectItem>
              <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DISBURSED">Disbursed</SelectItem>
            </SelectContent>
          </Select>

          {/* Loan Type Select */}
          <Select value={loanType || 'all'} onValueChange={(val) => { setLoanType(val === 'all' || !val ? '' : val); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs border-border bg-background w-36">
              <SelectValue placeholder="Loan Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-foreground z-50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PERSONAL">Personal</SelectItem>
              <SelectItem value="HOME">Home</SelectItem>
              <SelectItem value="AUTO">Auto</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="EDUCATION">Education</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-4 bg-border mx-1 hidden lg:block" />

          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="border-border text-foreground hover:bg-muted cursor-pointer h-8 shadow-sm font-semibold flex items-center gap-1.5 rounded-md px-3 text-xs shrink-0"
          >
            <ArrowsCounterClockwise className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Table Container Card */}
      <Card className="border-border bg-background text-foreground shadow-sm overflow-hidden rounded-xl py-0!">
        <div>
          {error && (
            <div className="p-4 text-sm text-destructive font-semibold text-center bg-destructive/10 border-b border-border flex items-center justify-center gap-2">
              <Warning className="h-4.5 w-4.5 text-destructive" weight="fill" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-background border-b border-border">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-left">Application No.</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-left">Applicant Name</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-left">Loan Type</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-right">Loan Amount</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-left">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-left">Created At</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-b border-border">
                      <TableCell className="py-4 px-6"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6 flex justify-end"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-5 w-20 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 px-6"><div className="h-8 w-16 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No applications in queue</h3>
                        <p className="text-sm mt-1 max-w-sm font-medium text-muted-foreground">There are no applications matching your current filter criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className={`hover:bg-muted/30 transition-colors duration-150 group cursor-pointer text-left ${expandedId === item.id ? 'border-b-0 bg-muted/10' : 'border-b border-border'}`}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-primary py-3.5 px-6">{item.applicationNumber}</TableCell>
                        <TableCell className="font-bold text-foreground py-3.5 px-6 text-sm">{item.applicantName}</TableCell>
                        <TableCell className="text-xs tracking-wider uppercase font-semibold text-muted-foreground py-3.5 px-6">{item.loanType}</TableCell>
                        <TableCell className="text-right font-bold text-foreground py-3.5 px-6">{formatCurrency(item.loanAmount)}</TableCell>
                        <TableCell className="py-3.5 px-6">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono py-3.5 px-6 flex items-center gap-1.5 mt-2 border-0">
                          <Calendar className="h-3.5 w-3.5 opacity-75" />
                          <span>{formatDate(item.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right py-3.5 px-6" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/applications/${item.id}`)}
                            className="h-8 px-3 border-border hover:bg-primary/10 hover:border-primary/20 hover:text-primary text-foreground cursor-pointer shadow-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Assess
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expandable row details */}
                      <TableRow className={`hover:bg-transparent p-0! ${expandedId === item.id ? '' : 'hidden'}`}>
                        <TableCell colSpan={7} className="p-0 border-none">
                          <AnimatePresence initial={false}>
                            {expandedId === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden bg-muted/10 border-b border-border/50"
                              >
                                <div className="flex flex-wrap gap-x-6 gap-y-2 px-12 py-3.5 text-xs text-muted-foreground items-center">
                                  <div className="flex items-center gap-1.5">
                                    <EnvelopeSimple className="h-4 w-4 opacity-75 text-foreground" />
                                    <span className="font-semibold text-foreground">Email:</span>
                                    <span>{item.email}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4 opacity-75 text-foreground" />
                                    <span className="font-semibold text-foreground">Phone:</span>
                                    <span>{item.phone}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4 opacity-75 text-foreground" />
                                    <span className="font-semibold text-foreground">Employment:</span>
                                    <span>{item.employmentType}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-1.5">
                                    <CurrencyInr className="h-4 w-4 opacity-75 text-foreground" />
                                    <span className="font-semibold text-foreground">Monthly Income:</span>
                                    <span className="font-bold text-foreground">{formatCurrency(item.monthlyIncome)}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination & Limits */}
          <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                Rows per page
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm font-semibold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3 rounded-lg text-xs"
              >
                <CaretLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center justify-center px-3 text-xs font-semibold border border-border rounded-lg bg-background shadow-sm h-8">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3 rounded-lg text-xs"
              >
                Next
                <CaretRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
