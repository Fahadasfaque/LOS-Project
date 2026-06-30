'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FilePlus,
  MagnifyingGlass,
  ArrowsCounterClockwise,
  CaretLeft,
  CaretRight,
  Eye,
  DownloadSimple,
  Funnel,
  Warning,
  Plus,
  UploadSimple,
  Trash,
  DotsThreeVertical,
  User,
  House,
  Car,
  Briefcase,
  GraduationCap
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

export default function MyApplicationsPage() {
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
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    ];
    return colors[char % colors.length];
  };

  const getLoanTypeIcon = (type: string) => {
    switch (type) {
      case 'PERSONAL':
        return <User className="h-3.5 w-3.5 text-sky-500 mr-1.5 inline" weight="bold" />;
      case 'HOME':
        return <House className="h-3.5 w-3.5 text-emerald-500 mr-1.5 inline" weight="bold" />;
      case 'AUTO':
        return <Car className="h-3.5 w-3.5 text-amber-500 mr-1.5 inline" weight="bold" />;
      case 'BUSINESS':
        return <Briefcase className="h-3.5 w-3.5 text-purple-500 mr-1.5 inline" weight="bold" />;
      case 'EDUCATION':
        return <GraduationCap className="h-3.5 w-3.5 text-indigo-500 mr-1.5 inline" weight="bold" />;
      default:
        return null;
    }
  };
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

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

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DRAFT':
        return <span className="inline-flex items-center rounded bg-muted text-muted-foreground px-2.5 py-1 text-xs font-bold border border-border uppercase font-mono">Draft</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center rounded bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold border border-primary/20 animate-pulse uppercase font-mono">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center rounded bg-amber-500/10 text-amber-600 px-2.5 py-1 text-xs font-bold border border-amber-500/20 uppercase font-mono">Reviewing</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-bold border border-emerald-500/20 uppercase font-mono">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-bold border border-destructive/20 uppercase font-mono">Rejected</span>;
      case 'OFFER_GENERATED':
        return <span className="inline-flex items-center rounded bg-purple-500/10 text-purple-600 px-2.5 py-1 text-xs font-bold border border-purple-500/20 animate-pulse uppercase font-mono">Awaiting Customer</span>;
      case 'OFFER_ACCEPTED':
        return <span className="inline-flex items-center rounded bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-bold border border-emerald-500/20 uppercase font-mono">Offer Accepted</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center rounded bg-violet-500/10 text-violet-600 px-2.5 py-1 text-xs font-bold border border-violet-500/20 uppercase font-mono">Disbursed</span>;
      default:
        return <span className="inline-flex items-center rounded bg-muted text-muted-foreground px-2.5 py-1 text-xs font-bold border border-border uppercase font-mono">{statusStr}</span>;
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
    link.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <FilePlus className="h-6.5 w-6.5 text-primary" weight="bold" />
            My Applications
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Manage and track your initiated loan cases.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border bg-card text-foreground cursor-pointer shadow-sm h-10 px-4 transition-all duration-150 font-bold" onClick={downloadCSV}>
            <DownloadSimple className="h-4 w-4 mr-2" weight="bold" />
            Export CSV
          </Button>
          <Link href="/dashboard/create-application">
            <Button className="bg-primary hover:bg-primary/95 hover:text-primary-foreground text-primary-foreground font-bold flex items-center gap-2 cursor-pointer h-10 px-4 rounded shadow transition-all duration-150">
              <Plus className="h-4 w-4" weight="bold" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Upload Component */}
      <BulkUpload type="applications" onSuccess={fetchApplications} open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} />

      <Card className="border-border bg-card text-foreground shadow-sm transition-colors duration-200 overflow-hidden">
        <CardHeader className=" border-b border-border bg-muted/20">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Records</label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Applicant name, application number, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-background border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground shadow-sm"
                />
              </div>
            </div>

            <div className="w-full lg:w-48 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 rounded border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="OFFER_GENERATED">Awaiting Customer</option>
                <option value="OFFER_ACCEPTED">Offer Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISBURSED">Disbursed</option>
              </select>
            </div>

            <div className="w-full lg:w-48 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => {
                  setLoanType(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 rounded border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value="">All Types</option>
                <option value="PERSONAL">Personal</option>
                <option value="HOME">Home</option>
                <option value="AUTO">Auto</option>
                <option value="BUSINESS">Business</option>
                <option value="EDUCATION">Education</option>
              </select>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button type="submit" variant="outline" className="flex-1 lg:flex-none cursor-pointer h-9 shadow-sm font-bold border-border bg-card text-foreground hover:bg-muted">
                <Funnel className="h-4 w-4 mr-2" weight="bold" />
                Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="border-border text-foreground hover:bg-muted cursor-pointer h-9 shadow-sm font-bold"
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkDialogOpen(true)}
                className="border-border text-foreground hover:bg-muted cursor-pointer h-9 shadow-sm font-bold flex items-center gap-1.5 animate-in duration-200"
              >
                <UploadSimple className="h-4 w-4" weight="bold" />
                Bulk Import
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-sm text-destructive font-semibold text-center bg-destructive/10 border-b border-border flex items-center justify-center gap-2">
              <Warning className="h-4.5 w-4.5 text-destructive" weight="fill" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 py-4 pl-4 select-none">
                    <input type="checkbox" className="h-4 w-4 rounded border-border cursor-pointer accent-black" />
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4">Application No.</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4">User</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4">Loan Type</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4 text-right">Loan Amount</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4 text-right">Monthly Income</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4">Status</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4">Created At</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-b border-border">
                      <TableCell className="w-12 py-4 pl-4"><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 flex justify-end"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell className="py-4"><div className="h-5 w-20 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-8 w-20 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FilePlus className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No applications found</h3>
                        <p className="text-sm mt-1 max-w-sm font-medium">There are no applications matching your current filter criteria. Try adjusting your search or start a new application.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4 border-border text-foreground cursor-pointer shadow-sm font-bold"
                          onClick={resetFilters}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors duration-150 group">
                      <TableCell className="w-12 py-4 pl-4 select-none">
                        <input type="checkbox" className="h-4 w-4 rounded border-border cursor-pointer accent-black" />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-primary py-4">{item.applicationNumber}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarBg(item.applicantName)}`}>
                            {getInitials(item.applicantName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm truncate leading-snug">{item.applicantName}</p>
                            <p className="text-[10px] text-muted-foreground truncate leading-none">{item.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs tracking-wider uppercase font-bold text-muted-foreground py-4">
                        <span className="inline-flex items-center">
                          {getLoanTypeIcon(item.loanType)}
                          {item.loanType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-foreground py-4">{formatCurrency(item.loanAmount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-4 font-semibold">{formatCurrency(item.monthlyIncome)}</TableCell>
                      <TableCell className="py-4">{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono py-4 font-semibold">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right py-4 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/applications/${item.id}`)}
                            title="View Details"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toast.info("Compliance rules restrict deletion of active applications.")}
                            title="Delete"
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toast.info("Audit log logged in compliance registry.")}
                            title="More Actions"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                          >
                            <DotsThreeVertical className="h-4 w-4" weight="bold" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
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
                className="h-8 px-2 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm font-bold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="text-xs text-muted-foreground font-bold">
              Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-bold select-none h-8 px-2.5 flex items-center gap-1 border border-border/50 hover:bg-muted/50"
              >
                <CaretLeft className="h-3.5 w-3.5" weight="bold" />
                Previous
              </Button>
              
              {/* Dynamic numeric pages */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                const isActive = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded text-xs font-extrabold flex items-center justify-center cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow' 
                        : 'bg-muted/30 text-foreground hover:bg-muted border border-border/30'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <Button
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-bold select-none h-8 px-2.5 flex items-center gap-1 border border-border/50 hover:bg-muted/50"
              >
                Next
                <CaretRight className="h-3.5 w-3.5" weight="bold" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
