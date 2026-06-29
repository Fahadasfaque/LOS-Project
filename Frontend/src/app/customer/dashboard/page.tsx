'use client';

/**
 * @file page.tsx (/customer/dashboard)
 * @description Customer Self-Service Portal Dashboard.
 *
 * Shows:
 * 1. Welcome header with applicant name & latest application number
 * 2. Application status card with friendly label + progress tracker
 * 3. Action Center — context-aware next steps based on current status
 * 4. Quick stats grid (EMI, disbursed amount, documents count, etc.)
 * 5. Recent notification preview (top 3)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  getCustomerStatus,
  formatINR,
  formatLoanType,
  PROGRESS_STEPS,
  getCurrentStep,
} from '@/lib/customerStatusMap';
import {
  FileText,
  Folder,
  Gift,
  Bell,
  CheckCircle,
  Clock,
  ArrowRight,
  Spinner,
  Lightning,
  CurrencyInr,
  CalendarCheck,
  Receipt,
  ArrowSquareOut,
} from '@phosphor-icons/react';

interface Application {
  id: string;
  applicationNumber: string;
  applicantName: string;
  loanType: string;
  loanAmount: number;
  status: string;
  createdAt: string;
  offer?: {
    loanAmount: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    offerStatus: string;
    expiresAt: string;
  } | null;
  disbursement?: {
    amount: number;
    referenceNumber: string;
    disbursedAt: string;
  } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, notifRes] = await Promise.all([
          api.get('/customer/applications'),
          api.get('/customer/notifications'),
        ]);

        if (appsRes.success && appsRes.data?.length > 0) {
          setApplication(appsRes.data[0]);
        }
        if (notifRes.success && Array.isArray(notifRes.data)) {
          setNotifications(notifRes.data.slice(0, 3));
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const statusInfo = application ? getCustomerStatus(application.status) : null;
  const currentStep = application ? getCurrentStep(application.status) : 0;

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName}
        </h1>
        {application && (
          <p className="text-sm text-muted-foreground mt-1">
            Application{' '}
            <span className="font-mono font-semibold text-foreground">
              {application.applicationNumber}
            </span>{' '}
            · {formatLoanType(application.loanType)} · {formatINR(application.loanAmount)}
          </p>
        )}
      </div>

      {!application ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No Applications Yet</h3>
          <p className="text-xs text-muted-foreground">
            Your loan application will appear here once your Loan Officer creates it.
          </p>
        </div>
      ) : (
        <>
          {/* ── Application Status Card ─────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Application Status
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                      statusInfo?.color === 'green'
                        ? 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400'
                        : statusInfo?.color === 'amber'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
                        : statusInfo?.color === 'red'
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : statusInfo?.color === 'purple'
                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400'
                        : 'bg-primary/10 text-primary border-primary/30'
                    }`}
                  >
                    {statusInfo?.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{statusInfo?.description}</p>
              </div>
              <Link
                href={`/customer/applications/${application.id}`}
                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
              >
                View Details
                <ArrowSquareOut className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Progress tracker */}
            {application.status !== 'REJECTED' && (
              <div className="relative">
                {/* Track line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (PROGRESS_STEPS.length - 1)) * 100))}%`,
                  }}
                />

                <div className="relative flex justify-between">
                  {PROGRESS_STEPS.map((step) => {
                    const completed = currentStep > step.step;
                    const active = currentStep === step.step;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-2" style={{ width: `${100 / PROGRESS_STEPS.length}%` }}>
                        <div
                          className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 transition-all ${
                            completed
                              ? 'border-primary bg-primary text-primary-foreground'
                              : active
                              ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/20'
                              : 'border-border bg-background text-muted-foreground'
                          }`}
                        >
                          {completed ? (
                            <CheckCircle className="h-4 w-4" weight="fill" />
                          ) : (
                            step.step
                          )}
                        </div>
                        <p className={`text-[9px] text-center leading-tight ${active ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Action Center ───────────────────────────────────────── */}
          <ActionCenter application={application} />

          {/* ── Quick Stats Grid ────────────────────────────────────── */}
          {application.offer && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<CurrencyInr className="h-4 w-4" />}
                label="Loan Amount"
                value={formatINR(application.offer.loanAmount)}
                color="blue"
              />
              <StatCard
                icon={<Receipt className="h-4 w-4" />}
                label="Monthly EMI"
                value={formatINR(application.offer.emiAmount)}
                color="purple"
              />
              <StatCard
                icon={<CalendarCheck className="h-4 w-4" />}
                label="Tenure"
                value={`${application.offer.tenureMonths} months`}
                color="amber"
              />
              <StatCard
                icon={<Receipt className="h-4 w-4" />}
                label="Interest Rate"
                value={`${application.offer.interestRate}% p.a.`}
                color="green"
              />
            </div>
          )}

          {/* ── Recent Notifications ─────────────────────────────── */}
          {notifications.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-foreground">Recent Notifications</p>
                <Link href="/customer/notifications" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      !n.isRead ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{n.message}</p>
                    </div>
                    <Clock className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Action Center Component ─────────────────────────────────────────────────

function ActionCenter({ application }: { application: Application }) {
  const actions = getActionItems(application);
  if (actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Lightning className="h-4 w-4 text-amber-500" weight="fill" />
        <p className="text-sm font-bold text-foreground">Action Center</p>
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
          {actions.length}
        </span>
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-lg bg-card border border-border px-3 py-3 hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">{action.title}</p>
              <p className="text-[11px] text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

interface ActionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function getActionItems(app: Application): ActionItem[] {
  const items: ActionItem[] = [];

  switch (app.status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      items.push({
        title: 'Upload Required Documents',
        description: 'Ensure all required documents are uploaded for faster processing.',
        href: '/customer/documents',
        icon: <Folder className="h-4 w-4" />,
      });
      break;

    case 'OFFER_GENERATED':
      items.push({
        title: 'Review Your Loan Offer',
        description: 'Your offer is ready. Please accept or decline it before it expires.',
        href: `/customer/offers/${app.id}`,
        icon: <Gift className="h-4 w-4" />,
      });
      break;

    case 'OFFER_ACCEPTED':
      items.push({
        title: 'Disbursement In Progress',
        description: 'Your offer has been accepted. Funds are being processed.',
        href: `/customer/applications/${app.id}`,
        icon: <CheckCircle className="h-4 w-4" />,
      });
      break;
  }

  return items;
}

// ─── StatCard Component ───────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'amber' | 'green';
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border mb-2.5 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
