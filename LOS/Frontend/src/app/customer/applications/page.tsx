'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCustomerStatus, formatINR, formatLoanType } from '@/lib/customerStatusMap';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowRight, Spinner, Calendar, CurrencyInr, ClipboardText, CheckCircle, Clock } from '@phosphor-icons/react';

interface Application {
  id: string;
  applicationNumber: string;
  applicantName: string;
  loanType: string;
  loanAmount: number;
  status: string;
  createdAt: string;
}

const statusBadgeClass: Record<string, string> = {
  green: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  red: 'bg-destructive/10 text-destructive border-destructive/30',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400',
  blue: 'bg-primary/10 text-primary border-primary/30',
};

export default function CustomerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await api.get('/customer/applications');
        if (res.success && Array.isArray(res.data)) {
          setApplications(res.data);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

  const total = applications.length;
  const active = applications.filter((a) => !['REJECTED', 'DISBURSED'].includes(a.status)).length;
  const disbursed = applications.filter((a) => a.status === 'DISBURSED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">My Applications</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View all your active and closed loan applications with Fortress Banking.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total</p>
                <p className="text-lg font-bold text-foreground leading-tight">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Active</p>
                <p className="text-lg font-bold text-foreground leading-tight">{active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Disbursed</p>
                <p className="text-lg font-bold text-foreground leading-tight">{disbursed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-bold">All Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-14 w-14 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-foreground mb-1">No Applications Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You don't have any loan applications yet. Contact your branch to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">App Number</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Loan Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide">Applied On</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const statusInfo = getCustomerStatus(app.status);
                    return (
                      <TableRow key={app.id} className="hover:bg-muted/30 border-border/50">
                        <TableCell className="font-mono text-xs font-bold text-foreground py-3.5">
                          {app.applicationNumber}
                        </TableCell>
                        <TableCell className="text-xs text-foreground py-3.5">
                          {formatLoanType(app.loanType)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground py-3.5">
                          {formatINR(app.loanAmount)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusBadgeClass[statusInfo.color]}`}
                          >
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3.5">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right py-3.5">
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                            <Link href={`/customer/applications/${app.id}`}>
                              View <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
