'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnimatePresence, motion } from 'motion/react';
import { ApplicationTableActions } from './ApplicationTableActions';
import {
  FilePlus,
  MagnifyingGlass,
  ArrowsCounterClockwise,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  Warning,
  Plus,
  UploadSimple,
  User,
  House,
  Car,
  Briefcase,
  GraduationCap,
  X,
  FileText,
  Clock,
  CheckCircle,
  CurrencyInr,
  FolderSimple
} from '@phosphor-icons/react';
import { BulkUpload } from '@/components/ui/bulk-upload';
import { toast } from 'sonner';

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

export default function ApplicationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loanType, setLoanType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [error, setError] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Global KPI stats state
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    review: 0,
    disbursed: 0
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.trim()[0] || '').toUpperCase();
  };

  const getAvatarBg = (name: string) => {
    const char = name.charCodeAt(0) || 0;
    const colors = [
      'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
      'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
      'bg-amber-50 text-amber-650 dark:bg-amber-950/40 dark:text-amber-450 border-amber-100 dark:border-amber-900/30',
      'bg-rose-50 text-rose-650 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
      'bg-purple-50 text-purple-650 dark:bg-purple-950/40 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
    ];
    return colors[char % colors.length];
  };

  const getLoanTypeBadge = (type: string) => {
    switch (type) {
      case 'PERSONAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wide uppercase font-mono">
            <User className="h-3.5 w-3.5" /> Personal
          </span>
        );
      case 'HOME':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-250 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wide uppercase font-mono">
            <House className="h-3.5 w-3.5" /> Home
          </span>
        );
      case 'AUTO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-250 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold tracking-wide uppercase font-mono">
            <Car className="h-3.5 w-3.5" /> Auto
          </span>
        );
      case 'BUSINESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-purple-250 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400 text-[10px] font-bold tracking-wide uppercase font-mono">
            <Briefcase className="h-3.5 w-3.5" /> Business
          </span>
        );
      case 'EDUCATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-indigo-250 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold tracking-wide uppercase font-mono">
            <GraduationCap className="h-3.5 w-3.5" /> Education
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-bold tracking-wide uppercase font-mono">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DRAFT':
        return <span className="inline-flex items-center rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Draft</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center rounded border border-blue-250 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center rounded border border-amber-250 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Reviewing</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded border border-emerald-250 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded border border-rose-250 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Rejected</span>;
      case 'OFFER_GENERATED':
        return <span className="inline-flex items-center rounded border border-purple-250 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 text-purple-655 dark:text-purple-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Awaiting Customer</span>;
      case 'OFFER_ACCEPTED':
        return <span className="inline-flex items-center rounded border border-emerald-250 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Offer Accepted</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center rounded border border-purple-250 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">Disbursed</span>;
      default:
        return <span className="inline-flex items-center rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[9px] font-bold tracking-wide uppercase font-mono px-2 py-0.5">{statusStr}</span>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/applications?limit=1000');
      if (res.success && res.data && Array.isArray(res.data.items)) {
        const allItems = res.data.items;
        const draftCount = allItems.filter((i: any) => i.status === 'DRAFT').length;
        const reviewCount = allItems.filter((i: any) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW').length;
        const disbursedCount = allItems.filter((i: any) => i.status === 'DISBURSED').length;
        setStats({
          total: allItems.length,
          draft: draftCount,
          review: reviewCount,
          disbursed: disbursedCount
        });
      }
    } catch (err) {
      console.error(err);
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
      
      // Update global KPI stats
      fetchStats();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, loanType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setLoanType('');
    setPage(1);
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
    link.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadCSVForSelected = () => {
    const selectedData = items.filter(item => selectedItems.includes(item.id));
    const headers = ['Application No.', 'Applicant Name', 'Loan Type', 'Loan Amount', 'Monthly Income', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...selectedData.map(item => [
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
    link.download = `selected_applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setSelectedItems([]);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 w-full pb-6">
      {/* Clean Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 select-none">
        <div className="text-left">
          <h1 className="font-semibold text-2xl text-foreground leading-snug tracking-tight">
            Applications
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Manage and track initiated loan cases across the terminal.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            className="border-border bg-card text-foreground cursor-pointer shadow-sm h-9 px-4 transition-all duration-150 font-semibold text-xs flex items-center gap-1.5 rounded-lg" 
            onClick={downloadCSV}
          >
            <DownloadSimple className="h-4 w-4" weight="bold" />
            Export CSV
          </Button>
          <Link href="/dashboard/create-application">
            <Button className="bg-primary hover:bg-primary/95 hover:text-primary-foreground text-primary-foreground font-semibold flex items-center gap-1.5 cursor-pointer h-9 px-4 rounded-lg transition-all duration-150 shadow-sm text-xs">
              <Plus className="h-4 w-4" weight="bold" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Block */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 select-none">
        {/* Card 1 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
            <FolderSimple className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Total Cases</span>
            <span className="font-bold text-lg text-foreground leading-tight">{stats.total}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0 border border-indigo-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Active Drafts</span>
            <span className="font-bold text-lg text-foreground leading-tight">{stats.draft}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-505 shrink-0 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Pending Review</span>
            <span className="font-bold text-lg text-foreground leading-tight">{stats.review}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 transition-colors duration-200">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-550 shrink-0 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-muted-foreground text-xs font-medium">Cases Disbursed</span>
            <span className="font-bold text-lg text-foreground leading-tight">{stats.disbursed}</span>
          </div>
        </div>
      </div>

      {/* Bulk Upload Component */}
      <BulkUpload type="applications" onSuccess={fetchApplications} open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} />

      {/* Clean Inline Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records by applicant name, app number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 bg-background border-border text-foreground placeholder-muted-foreground shadow-none rounded-md w-full text-xs"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto scrollbar-none">
          {/* Status Filter Dropdown */}
          <Select value={status || 'all'} onValueChange={(val) => setStatus(val === 'all' || !val ? '' : val)}>
            <SelectTrigger className="h-8 text-xs border-border bg-background w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-foreground z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="OFFER_GENERATED">Awaiting Customer</SelectItem>
              <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DISBURSED">Disbursed</SelectItem>
            </SelectContent>
          </Select>

          {/* Loan Type Filter Dropdown */}
          <Select value={loanType || 'all'} onValueChange={(val) => setLoanType(val === 'all' || !val ? '' : val)}>
            <SelectTrigger className="h-8 text-xs border-border bg-background w-36">
              <SelectValue placeholder="All Types" />
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
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkDialogOpen(true)}
            className="border-border text-foreground hover:bg-muted cursor-pointer h-8 shadow-sm font-semibold flex items-center gap-1.5 rounded-md px-3 text-xs shrink-0"
          >
            <UploadSimple className="h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      </div>

      {/* Table Container Card */}
      <Card className="border border-border bg-background text-foreground shadow-sm overflow-hidden rounded-xl py-0!">
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
                  <TableHead className="w-[40px] px-4 py-3">
                    <Checkbox 
                      checked={items.length > 0 && selectedItems.length === items.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems(items.map(i => i.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-4 text-left">APPLICATION NO.</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-4 text-left">USER</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-4 text-left">LOAN TYPE</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-4 text-left">LOAN AMOUNT</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-4 text-left">STATUS</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs py-3 px-4 text-left">CREATED AT</TableHead>
                  <TableHead className="text-right text-muted-foreground font-semibold text-xs py-3 px-4">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-b border-border/50">
                      <TableCell className="py-3 px-4"><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-40 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-6 w-20 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-6 w-16 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-3 px-4"><div className="h-8 w-8 ml-auto bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FilePlus className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No applications found</h3>
                        <p className="text-sm mt-1 max-w-sm font-medium">No credit applications match your search criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow 
                        className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors duration-150 ${
                          selectedItems.includes(item.id) ? 'bg-muted/20' : ''
                        } ${expandedId === item.id ? 'border-b-0 bg-muted/10' : ''}`}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <TableCell className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedItems(prev => [...prev, item.id]);
                              } else {
                                setSelectedItems(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                            aria-label={`Select ${item.applicantName}`}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Link 
                            href={`/dashboard/applications/${item.id}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono font-bold text-xs text-primary hover:underline"
                          >
                            {item.applicationNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${getAvatarBg(item.applicantName)}`}>
                              {getInitials(item.applicantName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs leading-snug">{item.applicantName}</p>
                              <p className="text-[10px] text-muted-foreground leading-none mt-0.5 font-mono">{item.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          {getLoanTypeBadge(item.loanType)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left text-xs font-bold text-foreground">
                          {formatCurrency(item.loanAmount)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left">
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground font-mono">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <ApplicationTableActions application={item} onActionComplete={fetchApplications} />
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail row matching users style exactly */}
                      <TableRow className={`hover:bg-transparent p-0! ${expandedId === item.id ? '' : 'hidden'}`}>
                        <TableCell colSpan={8} className="p-0 border-none">
                          <AnimatePresence initial={false}>
                            {expandedId === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden bg-muted/10 border-b border-border/50"
                              >
                                <div className="flex flex-wrap gap-4 px-12 py-3.5 text-xs text-muted-foreground items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">Phone Number:</span>
                                    <span className="font-mono text-foreground">{item.phone}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">Employment:</span>
                                    <span className="text-foreground">{item.employmentType || 'Not Provided'}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">Monthly Income:</span>
                                    <span className="text-foreground">{formatCurrency(item.monthlyIncome)}</span>
                                  </div>
                                  <span className="text-muted-foreground/30">|</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">Application ID:</span>
                                    <span className="font-mono">{item.id}</span>
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
          <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="h-8 w-8 rounded-md border-border text-foreground hover:bg-muted shadow-sm cursor-pointer animate-none"
              >
                <CaretLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center text-xs font-semibold border border-border rounded-md bg-background shadow-sm h-8 min-w-[32px]">
                {page}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="h-8 w-8 rounded-md border-border text-foreground hover:bg-muted shadow-sm cursor-pointer animate-none"
              >
                <CaretRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Floating Action Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border border-border text-foreground shadow-2xl rounded-full px-5 py-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedItems.length} selected
          </span>
          <div className="w-px h-4 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-2 rounded-full text-xs font-medium text-foreground hover:bg-muted px-3 cursor-pointer" 
            onClick={downloadCSVForSelected}
          >
            <DownloadSimple className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted px-3 cursor-pointer" 
            onClick={() => setSelectedItems([])}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        </div>
      )}
      
      {/* Table Container Card wrapper class hack helper */}
      <style jsx global>{`
        .py-0\\! {
          padding-top: 0px !important;
          padding-bottom: 0px !important;
        }
      `}</style>
    </div>
  );
}
