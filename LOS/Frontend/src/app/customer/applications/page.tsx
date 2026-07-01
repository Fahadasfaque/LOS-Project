'use client';

/**
 * @file page.tsx (/customer/applications)
 * @description Customer Loan Applications List Page.
 *
 * Lists all loan applications owned by the authenticated customer.
 * Displays details: Application Number, Type, Amount, Status, and Date.
 * Clicking an application routes to /customer/applications/[id].
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getCustomerStatus,
  formatINR,
  formatLoanType,
} from '@/lib/customerStatusMap';
import api from '@/services/api';
import { FileText, ArrowRight, Spinner, Calendar, CurrencyInr } from '@phosphor-icons/react';

interface Application {
  id: string;
  applicationNumber: string;
  applicantName: string;
  loanType: string;
  loanAmount: number;
  status: string;
  createdAt: string;
}

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Applications</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View all your active and closed loan applications with Fortress Banking.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Loan Applications Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You do not have any active or past loan applications. Contact a branch manager if you believe this is an error.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {applications.map((app) => {
            const statusInfo = getCustomerStatus(app.status);
            return (
              <Link
                key={app.id}
                href={`/customer/applications/${app.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-bold text-foreground">
                      {app.applicationNumber}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        statusInfo.color === 'green'
                          ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
                          : statusInfo.color === 'amber'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                          : statusInfo.color === 'red'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : statusInfo.color === 'purple'
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {formatLoanType(app.loanType)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CurrencyInr className="h-3.5 w-3.5" />
                      {formatINR(app.loanAmount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Navigation Indicator */}
                <div className="flex items-center gap-2 self-end sm:self-center text-xs font-semibold text-primary group-hover:underline">
                  <span>Track Application</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
