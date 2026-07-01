'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trash,
  User,
  Bank,
  CurrencyInr,
  Info,
  CheckCircle,
  ArrowsCounterClockwise,
  Phone,
  IdentificationCard,
  EnvelopeSimple,
  LockKey,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────
const getLoanTypeLabel = (val: string) => {
  switch (val) {
    case 'PERSONAL': return 'Personal Loan';
    case 'HOME': return 'Home Loan';
    case 'AUTO': return 'Auto Loan';
    case 'BUSINESS': return 'Business Loan';
    case 'EDUCATION': return 'Education Loan';
    default: return 'Not Selected';
  }
};

const getEmploymentLabel = (val: string) => {
  switch (val) {
    case 'SALARIED': return 'Salaried';
    case 'SELF_EMPLOYED': return 'Self-Employed';
    case 'BUSINESS_OWNER': return 'Business Owner';
    default: return 'Not Selected';
  }
};

// ─── Step Indicator ──────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, title: 'Customer Information', sub: 'Personal & Contact Details' },
  { n: 2, title: 'Loan Preferences', sub: 'Product & Employment Details' },
  { n: 3, title: 'Financial Profile', sub: 'Income & Financial Details' },
];

function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden select-none grid grid-cols-3">
      {STEPS.map((s, idx) => {
        const isActive = currentStep === s.n;
        const isDone = currentStep > s.n;
        return (
          <div
            key={s.n}
            className={`relative p-4 flex items-center gap-3 ${idx < 2 ? 'border-r border-border' : ''}`}
          >
            {/* Circle */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'}`}
            >
              {s.n}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">
                {s.sub}
              </span>
            </div>
            {/* Active underline */}
            <div
              className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${isActive ? 'bg-primary' : 'bg-transparent'}`}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Field Error ─────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-rose-500 font-semibold mt-1 text-left">{msg}</p>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CreateApplicationPage() {
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 fields
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');

  // Step 2 fields
  const [loanType, setLoanType] = useState('PERSONAL');
  const [employmentType, setEmploymentType] = useState('SALARIED');
  const [loanTypeChanged, setLoanTypeChanged] = useState(true); // default option is valid
  const [employmentTypeChanged, setEmploymentTypeChanged] = useState(true); // default option is valid

  // Step 3 fields
  const [loanAmount, setLoanAmount] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field touched/dirty tracking for inline error reporting
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Dynamic real-time errors
  const getErrors = () => {
    const errs: Record<string, string> = {};

    // Step 1 Customer Info
    if (touched.applicantName || applicantName) {
      if (!applicantName.trim()) {
        errs.applicantName = 'Applicant full name is required.';
      } else if (applicantName.trim().length < 2) {
        errs.applicantName = 'Name must be at least 2 characters.';
      }
    }

    if (touched.email || email) {
      if (!email.trim()) {
        errs.email = 'Email address is required.';
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        errs.email = 'Enter a valid email address (e.g. rahul@example.com).';
      }
    }

    if (touched.phone || phone) {
      if (!phone.trim()) {
        errs.phone = 'Mobile phone number is required.';
      } else if (!/^\d{10}$/.test(phone.trim())) {
        errs.phone = 'Mobile phone must be exactly 10 digits.';
      }
    }

    if (touched.pan || pan) {
      if (!pan.trim()) {
        errs.pan = 'PAN card number is required.';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim())) {
        errs.pan = 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).';
      }
    }

    // Step 2 Loan Preferences
    if (currentStep >= 2) {
      if (!loanType) {
        errs.loanType = 'Loan category is required.';
      }
      if (!employmentType) {
        errs.employmentType = 'Employment nature is required.';
      }
    }

    // Step 3 Financials
    if (currentStep >= 3) {
      if (touched.loanAmount || loanAmount) {
        const amt = parseFloat(loanAmount);
        if (!loanAmount.trim()) {
          errs.loanAmount = 'Requested amount is required.';
        } else if (isNaN(amt) || amt <= 0) {
          errs.loanAmount = 'Requested amount must be a positive number.';
        }
      }
      if (touched.monthlyIncome || monthlyIncome) {
        const inc = parseFloat(monthlyIncome);
        if (!monthlyIncome.trim()) {
          errs.monthlyIncome = 'Net monthly income is required.';
        } else if (isNaN(inc) || inc < 0) {
          errs.monthlyIncome = 'Net monthly income must be a non-negative number.';
        }
      }
    }

    return errs;
  };

  const errors = getErrors();

  // ── Validation helpers ───────────────────────────────────────────────────
  const isStep1Valid = () => {
    return (
      applicantName.trim().length >= 2 &&
      /\S+@\S+\.\S+/.test(email.trim()) &&
      /^\d{10}$/.test(phone.trim()) &&
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim()) &&
      !errors.applicantName &&
      !errors.email &&
      !errors.phone &&
      !errors.pan
    );
  };

  const isStep2Valid = () => {
    return !!loanType && !!employmentType && !errors.loanType && !errors.employmentType;
  };

  const isStep3Valid = () => {
    const amt = parseFloat(loanAmount);
    const inc = parseFloat(monthlyIncome);
    return (
      loanAmount.trim() !== '' &&
      !isNaN(amt) &&
      amt > 0 &&
      monthlyIncome.trim() !== '' &&
      !isNaN(inc) &&
      inc >= 0 &&
      !errors.loanAmount &&
      !errors.monthlyIncome
    );
  };

  const isCurrentStepValid = () => {
    if (currentStep === 1) return isStep1Valid();
    if (currentStep === 2) return isStep2Valid();
    if (currentStep === 3) return isStep3Valid();
    return false;
  };

  // Recompute summary values dynamically
  const summaryApplicant = applicantName.trim() || 'Not Provided';
  const summaryPan = pan.trim() ? pan.toUpperCase() : 'Not Provided';
  const summaryType = loanTypeChanged ? getLoanTypeLabel(loanType) : 'Not Selected';
  const summaryEmp = employmentTypeChanged ? getEmploymentLabel(employmentType) : 'Not Selected';

  const handleNext = () => {
    // Touch all fields on current step before moving next so error highlights show up
    if (currentStep === 1) {
      setTouched((prev) => ({ ...prev, applicantName: true, email: true, phone: true, pan: true }));
      if (!isStep1Valid()) {
        toast.error('Please fix the errors in Customer Information.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setTouched((prev) => ({ ...prev, loanType: true, employmentType: true }));
      if (!isStep2Valid()) {
        toast.error('Please select the Loan Category and Employment Nature.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setTouched((prev) => ({ ...prev, loanAmount: true, monthlyIncome: true }));
      if (!isStep3Valid()) {
        toast.error('Please fix the errors in Financial Snapshot.');
        return;
      }
      handleSubmit();
    }
  };

  const handleClear = () => {
    setApplicantName('');
    setEmail('');
    setPhone('');
    setPan('');
    setLoanType('PERSONAL');
    setEmploymentType('SALARIED');
    setLoanTypeChanged(true);
    setEmploymentTypeChanged(true);
    setLoanAmount('');
    setMonthlyIncome('');
    setTouched({});
    setCurrentStep(1);
    toast.info('Form cleared.');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        applicantName: applicantName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        pan: pan.toUpperCase(),
        loanType,
        loanAmount: parseFloat(loanAmount),
        monthlyIncome: parseFloat(monthlyIncome),
        employmentType,
      };
      const res = await api.post('/applications', payload);
      if (res.success && res.data) {
        setIsSuccess(true);
        toast.success('Application created successfully in DRAFT mode!');
        setTimeout(() => {
          router.push(`/dashboard/applications/${res.data.id}`);
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create loan application.');
    } finally {
      setLoading(false);
    }
  };

  const saveLabel = currentStep === 3 ? 'Submit Application' : 'Save & Continue';

  return (
    <div className="w-full space-y-6 pb-10">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="text-left">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-bold text-2xl text-foreground leading-snug tracking-tight">
            Create New Loan Application
          </h1>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 select-none">
            <ShieldCheck className="h-3.5 w-3.5" weight="fill" />
            Secure &amp; Encrypted
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium">
          Start a new secure credit origination entry. All data is protected with bank-grade security.
        </p>
      </div>

      {/* ── Step Indicator ────────────────────────────────────────────────── */}
      <StepBar currentStep={currentStep} />

      {/* ── Main 3-Column Form ───────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">

          {/* ── Column 1: Customer Information ─────────────────────────── */}
          <div className="p-6 space-y-5">
            {/* Column Header */}
            <div className="flex items-start gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shrink-0">
                <User className="h-4.5 w-4.5" weight="bold" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-foreground leading-tight">Customer Information</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Provide accurate identity and contact details.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="applicantName" className="text-xs font-semibold text-foreground">
                  Applicant Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="applicantName"
                    value={applicantName}
                    onChange={(e) => {
                      setApplicantName(e.target.value);
                      markTouched('applicantName');
                    }}
                    onBlur={() => markTouched('applicantName')}
                    placeholder="e.g. Rahul Sharma"
                    className={`pl-9 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 shadow-none rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-primary ${errors.applicantName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                <FieldError msg={errors.applicantName} />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        markTouched('email');
                      }}
                      onBlur={() => markTouched('email')}
                      placeholder="e.g. rahul@example.com"
                      className={`pl-9 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 shadow-none rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-primary ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  <FieldError msg={errors.email} />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                    Mobile Phone (10 digits)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" weight="bold" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(v);
                        markTouched('phone');
                      }}
                      onBlur={() => markTouched('phone')}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      className={`pl-9 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 shadow-none rounded-lg font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  <FieldError msg={errors.phone} />
                </div>
              </div>

              {/* PAN */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="pan" className="text-xs font-semibold text-foreground">
                  Permanent Account Number (PAN)
                </Label>
                <div className="relative">
                  <IdentificationCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" weight="bold" />
                  <Input
                    id="pan"
                    value={pan}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase().slice(0, 10);
                      setPan(v);
                      markTouched('pan');
                    }}
                    onBlur={() => markTouched('pan')}
                    placeholder="E.g. ABCDE1234F"
                    maxLength={10}
                    className={`pl-9 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 shadow-none rounded-lg font-mono uppercase tracking-widest text-sm focus-visible:ring-1 focus-visible:ring-primary ${errors.pan ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                <FieldError msg={errors.pan} />
              </div>

              {/* PAN Security Note */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3.5 flex items-start gap-3 select-none">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <LockKey className="h-4 w-4 text-primary" weight="fill" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-tight">PAN is encrypted &amp; secure</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                    Your data is stored at rest using AES-256-GCM and protected with bank-grade security.
                  </p>
                </div>
                <LockKey className="h-4 w-4 text-primary/40 shrink-0 mt-0.5" weight="fill" />
              </div>
            </div>
          </div>

          {/* ── Column 2: Loan Preferences ──────────────────────────────── */}
          <div className="p-6 space-y-5">
            {/* Column Header */}
            <div className="flex items-start gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/15 shrink-0">
                <Bank className="h-4.5 w-4.5" weight="bold" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-foreground leading-tight">Loan Preferences</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Select the right loan product and employment type.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Loan Category */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="loanType" className="text-xs font-semibold text-foreground">
                  Loan Category
                </Label>
                <Select
                  value={loanType}
                  onValueChange={(val) => {
                    if (val) {
                      setLoanType(val);
                      setLoanTypeChanged(true);
                      markTouched('loanType');
                    }
                  }}
                >
                  <SelectTrigger
                    id="loanType"
                    className={`h-10 text-sm border-border bg-background w-full rounded-lg font-semibold text-foreground focus:ring-1 focus:ring-primary ${errors.loanType ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-foreground z-50">
                    <SelectItem value="PERSONAL">PERSONAL LOAN</SelectItem>
                    <SelectItem value="HOME">HOME LOAN</SelectItem>
                    <SelectItem value="AUTO">AUTO LOAN</SelectItem>
                    <SelectItem value="BUSINESS">BUSINESS LOAN</SelectItem>
                    <SelectItem value="EDUCATION">EDUCATION LOAN</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError msg={errors.loanType} />
              </div>

              {/* Employment Nature */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="employmentType" className="text-xs font-semibold text-foreground">
                  Employment Nature
                </Label>
                <Select
                  value={employmentType}
                  onValueChange={(val) => {
                    if (val) {
                      setEmploymentType(val);
                      setEmploymentTypeChanged(true);
                      markTouched('employmentType');
                    }
                  }}
                >
                  <SelectTrigger
                    id="employmentType"
                    className={`h-10 text-sm border-border bg-background w-full rounded-lg font-semibold text-foreground focus:ring-1 focus:ring-primary ${errors.employmentType ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select Employment" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-foreground z-50">
                    <SelectItem value="SALARIED">SALARIED</SelectItem>
                    <SelectItem value="SELF_EMPLOYED">SELF-EMPLOYED</SelectItem>
                    <SelectItem value="BUSINESS_OWNER">BUSINESS OWNER</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError msg={errors.employmentType} />
              </div>

              {/* Help Guide */}
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4 flex items-start gap-3 select-none">
                <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                  <Info className="h-4 w-4 text-blue-600" weight="fill" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-tight">Help Guide</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                    Choose the category and employment type that best matches the applicant's profile for accurate assessment and faster approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 3: Financial Snapshot ─────────────────────────────── */}
          <div className="p-6 space-y-5">
            {/* Column Header */}
            <div className="flex items-start gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/15 shrink-0">
                <CurrencyInr className="h-4.5 w-4.5" weight="bold" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-foreground leading-tight">Financial Snapshot</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Provide loan amount requested and verified monthly income.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Requested Amount */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="loanAmount" className="text-xs font-semibold text-foreground">
                  Requested Amount (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/70">₹</span>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => {
                      setLoanAmount(e.target.value);
                      markTouched('loanAmount');
                    }}
                    onBlur={() => markTouched('loanAmount')}
                    placeholder="5,00,000"
                    className={`pl-7 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 shadow-none rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-primary ${errors.loanAmount ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                <FieldError msg={errors.loanAmount} />
              </div>

              {/* Net Monthly Income */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="monthlyIncome" className="text-xs font-semibold text-foreground">
                  Net Monthly Income (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/70">₹</span>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => {
                      setMonthlyIncome(e.target.value);
                      markTouched('monthlyIncome');
                    }}
                    onBlur={() => markTouched('monthlyIncome')}
                    placeholder="85,000"
                    className={`pl-7 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 shadow-none rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-primary ${errors.monthlyIncome ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                <FieldError msg={errors.monthlyIncome} />
              </div>

              {/* Application Summary */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 text-left select-none">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Application Summary</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                    Live Check
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none">Applicant</p>
                    <p className={`text-xs font-bold mt-0.5 truncate ${summaryApplicant === 'Not Provided' ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                      {summaryApplicant}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none">PAN</p>
                    <p className={`text-xs font-bold mt-0.5 font-mono truncate ${summaryPan === 'Not Provided' ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                      {summaryPan}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none">Type</p>
                    <p className={`text-xs font-bold mt-0.5 truncate ${summaryType === 'Not Selected' ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                      {summaryType}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none">Employment</p>
                    <p className={`text-xs font-bold mt-0.5 truncate ${summaryEmp === 'Not Selected' ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                      {summaryEmp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="border-t border-border px-6 py-4 bg-muted/20 flex items-center justify-between gap-4">
          {/* Left: Clear All */}
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={loading || isSuccess}
            className="border-border text-foreground hover:bg-muted cursor-pointer h-9 px-4 font-semibold text-xs rounded-lg flex items-center gap-2 shrink-0"
          >
            <Trash className="h-3.5 w-3.5" weight="bold" />
            Clear All
          </Button>

          {/* Right: Cancel + Save & Continue */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={loading || isSuccess}
              className="border-border text-foreground hover:bg-muted cursor-pointer h-9 px-5 font-semibold text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={loading || isSuccess || !isCurrentStepValid()}
              className="bg-foreground hover:bg-foreground/90 text-background font-bold flex items-center gap-2 cursor-pointer h-9 px-6 rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <>
                  <ArrowsCounterClockwise className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {saveLabel}
                  <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
