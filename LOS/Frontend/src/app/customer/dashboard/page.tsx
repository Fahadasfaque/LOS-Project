'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FileText,
  FolderOpen,
  Gift,
  Bell,
  CheckCircle,
  Clock,
  ArrowRight,
  CurrencyInr,
  CalendarCheck,
  Receipt,
  ArrowSquareOut,
  Lightning,
  Folder,
  Calculator,
  ChevronDown,
  ChevronUp,
  TrendUp,
  Spinner,
  Warning,
  Info,
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

// ─── EMI Calculator ───────────────────────────────────────────────────────────
function EmiCalculatorWidget() {
  const [open, setOpen] = useState(true);
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(10);
  const [tenure, setTenure] = useState(24);

  const { emi, totalInterest, totalPayable } = useMemo(() => {
    const r = rate / 12 / 100;
    const n = tenure;
    if (r === 0) return { emi: principal / n, totalInterest: 0, totalPayable: principal };
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - principal;
    return { emi, totalInterest, totalPayable };
  }, [principal, rate, tenure]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Calculator className="h-3.5 w-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-bold">EMI Calculator</CardTitle>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Principal */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground font-medium">Loan Amount</Label>
              <span className="text-xs font-bold text-foreground">{formatINR(principal)}</span>
            </div>
            <Slider
              min={50000}
              max={5000000}
              step={50000}
              value={[principal]}
              onValueChange={([v]) => setPrincipal(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>₹50K</span><span>₹50L</span>
            </div>
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground font-medium">Interest Rate (p.a.)</Label>
              <span className="text-xs font-bold text-foreground">{rate}%</span>
            </div>
            <Slider
              min={5}
              max={30}
              step={0.5}
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5%</span><span>30%</span>
            </div>
          </div>

          {/* Tenure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground font-medium">Tenure</Label>
              <span className="text-xs font-bold text-foreground">{tenure} months</span>
            </div>
            <Slider
              min={6}
              max={360}
              step={6}
              value={[tenure]}
              onValueChange={([v]) => setTenure(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>6 mo</span><span>360 mo</span>
            </div>
          </div>

          <Separator />

          {/* Result */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Monthly EMI</p>
              <p className="text-xs font-bold text-primary">{formatINR(Math.round(emi))}</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Total Interest</p>
              <p className="text-xs font-bold text-foreground">{formatINR(Math.round(totalInterest))}</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Total Payable</p>
              <p className="text-xs font-bold text-foreground">{formatINR(Math.round(totalPayable))}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: 'blue' | 'purple' | 'amber' | 'green';
}) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  };
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border mb-2.5 ${colorMap[color]}`}>
          {icon}
        </div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Action Center ────────────────────────────────────────────────────────────
function ActionCenter({ application }: { application: Application }) {
  const actions = getActionItems(application);
  if (actions.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Lightning className="h-4 w-4 text-amber-500" weight="fill" />
          <CardTitle className="text-sm font-bold">Action Required</CardTitle>
          <Badge variant="secondary" className="bg-amber-500 text-white text-[10px] h-5 px-1.5 ml-1">
            {actions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
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
      </CardContent>
    </Card>
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
        href: `/customer/offers`,
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
          // fetch detail to get offer
          const detailRes = await api.get(`/customer/applications/${appsRes.data[0].id}`);
          setApplication(detailRes.success ? detailRes.data : appsRes.data[0]);
        }
        if (notifRes.success && Array.isArray(notifRes.data)) {
          setNotifications(notifRes.data.slice(0, 4));
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

  const statusColorClass = {
    green: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
    red: 'bg-destructive/10 text-destructive border-destructive/30',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400',
    blue: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <div className="space-y-5">
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {application
              ? `${formatLoanType(application.loanType)} · Application ${application.applicationNumber}`
              : 'Your customer portal is ready.'}
          </p>
        </div>
        {application && (
          <Button asChild size="sm" className="hidden sm:flex gap-1.5">
            <Link href={`/customer/applications/${application.id}`}>
              <ArrowSquareOut className="h-3.5 w-3.5" />
              View Application
            </Link>
          </Button>
        )}
      </div>

      {!application ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No Applications Yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your loan application will appear here once your Loan Officer creates it on your behalf.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── Left Column ─────────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Application Status Card */}
            <Card className="border-border">
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">
                      Application Status
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${statusColorClass[statusInfo?.color || 'blue']}`}
                      >
                        {statusInfo?.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{statusInfo?.description}</p>
                  </div>
                  <Link
                    href={`/customer/applications/${application.id}`}
                    className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline shrink-0"
                  >
                    Details
                    <ArrowSquareOut className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {/* Progress Tracker */}
                {application.status !== 'REJECTED' && (
                  <div className="relative pt-1">
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
                                  ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/20 animate-pulse'
                                  : 'border-border bg-background text-muted-foreground'
                              }`}
                            >
                              {completed ? <CheckCircle className="h-4 w-4" weight="fill" /> : step.step}
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
                {application.status === 'REJECTED' && (
                  <Alert variant="destructive">
                    <Warning className="h-4 w-4" />
                    <AlertTitle>Application Closed</AlertTitle>
                    <AlertDescription>
                      Your application has been closed. Please contact your Loan Officer for more details.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* KPI Stats */}
            {application.offer ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<CurrencyInr className="h-4 w-4" />} label="Loan Amount" value={formatINR(application.offer.loanAmount)} color="blue" />
                <StatCard icon={<Receipt className="h-4 w-4" />} label="Monthly EMI" value={formatINR(application.offer.emiAmount)} color="purple" />
                <StatCard icon={<CalendarCheck className="h-4 w-4" />} label="Tenure" value={`${application.offer.tenureMonths} months`} color="amber" />
                <StatCard icon={<TrendUp className="h-4 w-4" />} label="Interest Rate" value={`${application.offer.interestRate}% p.a.`} color="green" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<CurrencyInr className="h-4 w-4" />} label="Applied Amount" value={formatINR(application.loanAmount)} color="blue" />
                <StatCard icon={<Receipt className="h-4 w-4" />} label="Monthly EMI" value="Pending" sub="After offer generation" color="purple" />
                <StatCard icon={<CalendarCheck className="h-4 w-4" />} label="Loan Type" value={formatLoanType(application.loanType)} color="amber" />
                <StatCard icon={<TrendUp className="h-4 w-4" />} label="Interest Rate" value="TBD" sub="After credit review" color="green" />
              </div>
            )}

            {/* Action Center */}
            <ActionCenter application={application} />

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <Card className="border-border">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      Recent Activity
                    </CardTitle>
                    <Link href="/customer/notifications" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1.5">
                  {notifications.map((n, i) => (
                    <React.Fragment key={n.id}>
                      <div
                        className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                          !n.isRead ? 'bg-primary/5 border border-primary/20' : 'border border-transparent hover:bg-muted/30'
                        }`}
                      >
                        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{n.message}</p>
                        </div>
                        <Clock className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      </div>
                      {i < notifications.length - 1 && <Separator className="opacity-50" />}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right Column ─────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* EMI Calculator */}
            <EmiCalculatorWidget />

            {/* Quick Links */}
            <Card className="border-border">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-bold">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {[
                  { href: '/customer/documents', icon: <FolderOpen className="h-4 w-4" />, label: 'Upload Documents', desc: 'Add or replace documents' },
                  { href: '/customer/offers', icon: <Gift className="h-4 w-4" />, label: 'My Loan Offer', desc: 'Review and accept offer' },
                  { href: '/customer/notifications', icon: <Bell className="h-4 w-4" />, label: 'Notifications', desc: 'View all activity alerts' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Application Summary Card */}
            {application && (
              <Card className="border-border">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-bold">Application Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {[
                    { label: 'App Number', value: application.applicationNumber },
                    { label: 'Loan Type', value: formatLoanType(application.loanType) },
                    { label: 'Applied Amount', value: formatINR(application.loanAmount) },
                    { label: 'Submitted On', value: new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[11px] text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold text-foreground font-mono">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
