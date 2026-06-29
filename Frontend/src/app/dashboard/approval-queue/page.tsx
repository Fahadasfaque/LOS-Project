'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Eye, CheckSquare, Download, Filter, FileText, AlertTriangle } from 'lucide-react';

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

export default function ApprovalQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('UNDER_REVIEW'); // Default to UNDER_REVIEW (analyst verified)
  const [loanType, setLoanType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [error, setError] = useState('');

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
    setStatus('UNDER_REVIEW');
    setLoanType('');
    setPage(1);
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DRAFT':
        return <span className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-2.5 py-1 text-xs font-semibold border border-border">Draft</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center rounded-md bg-blue-500/10 text-blue-600 px-2.5 py-1 text-xs font-semibold border border-blue-500/20 animate-pulse dark:bg-blue-500/20 dark:text-blue-400">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center rounded-md bg-amber-500/10 text-amber-600 px-2.5 py-1 text-xs font-semibold border border-amber-500/20 dark:text-amber-500">Under Review</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-semibold border border-emerald-500/20 dark:text-emerald-500">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded-md bg-rose-500/10 text-rose-600 px-2.5 py-1 text-xs font-semibold border border-rose-500/20 dark:text-rose-500">Rejected</span>;
      case 'OFFER_GENERATED':
        return <span className="inline-flex items-center rounded-md bg-purple-500/10 text-purple-600 px-2.5 py-1 text-xs font-semibold border border-purple-500/20 animate-pulse dark:text-purple-400">Awaiting Customer</span>;
      case 'OFFER_ACCEPTED':
        return <span className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-semibold border border-emerald-500/20 dark:text-emerald-500">Offer Accepted</span>;
      case 'DISBURSED':
        return <span className="inline-flex items-center rounded-md bg-purple-500/10 text-purple-600 px-2.5 py-1 text-xs font-semibold border border-purple-500/20 dark:text-purple-400">Disbursed</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-2.5 py-1 text-xs font-semibold border border-border">{statusStr}</span>;
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
    link.download = `approval_queue_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Executive Approval Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Perform final review, authorize credit lines, and sign off disbursements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border bg-card text-foreground cursor-pointer shadow-sm h-10 px-4 transition-all duration-150" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card text-foreground shadow-sm transition-colors duration-200 overflow-hidden">
        <CardHeader className="p-4 border-b border-border bg-muted/20">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Search by Applicant Name, App Number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-card border-border focus-visible:ring-primary text-foreground placeholder-muted-foreground shadow-sm"
                />
              </div>
            </div>

            <div className="w-full lg:w-56 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value="">All Statuses</option>
                <option value="UNDER_REVIEW">Under Review (Recommended)</option>
                <option value="APPROVED">Approved</option>
                <option value="OFFER_GENERATED">Awaiting Customer</option>
                <option value="OFFER_ACCEPTED">Offer Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISBURSED">Disbursed</option>
              </select>
            </div>

            <div className="w-full lg:w-48 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => {
                  setLoanType(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
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
              <Button type="submit" variant="secondary" className="flex-1 lg:flex-none cursor-pointer h-9 shadow-sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="border-border text-foreground hover:bg-muted cursor-pointer h-9 shadow-sm"
              >
                Reset
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-sm text-rose-600 font-medium text-center bg-rose-50 border-b border-border flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4">Application No.</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4">Applicant Name</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4">Loan Type</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 text-right">Loan Amount</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 text-right">Monthly Income</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4">Created At</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-b border-border">
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4 flex justify-end"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell className="py-4"><div className="h-5 w-20 bg-muted rounded-full animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="py-4"><div className="h-8 w-16 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No applications in queue</h3>
                        <p className="text-sm mt-1 max-w-sm">There are no applications matching your current filter criteria.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4 border-border text-foreground cursor-pointer shadow-sm"
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
                      <TableCell className="font-mono text-xs font-semibold text-primary py-4">{item.applicationNumber}</TableCell>
                      <TableCell className="font-semibold text-foreground py-4 text-sm">{item.applicantName}</TableCell>
                      <TableCell className="text-xs tracking-wider uppercase font-semibold text-muted-foreground py-4">{item.loanType}</TableCell>
                      <TableCell className="text-right font-bold text-foreground py-4">{formatCurrency(item.loanAmount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground py-4 font-medium">{formatCurrency(item.monthlyIncome)}</TableCell>
                      <TableCell className="py-4">{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono py-4">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/applications/${item.id}`)}
                          className="h-8 px-3 border-border hover:bg-primary/10 hover:border-primary/20 hover:text-primary text-foreground cursor-pointer shadow-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination & Limits */}
          <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                Rows per page
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center justify-center px-3 text-sm font-medium border border-border rounded-md bg-card shadow-sm h-8">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="border-border text-foreground hover:bg-muted cursor-pointer shadow-sm h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
