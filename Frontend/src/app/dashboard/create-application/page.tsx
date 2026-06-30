'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PaperPlaneTilt,
  Trash,
  User,
  Bank,
  CurrencyInr,
  Info,
  CheckCircle,
  CaretDown,
  FilePlus,
  ArrowsCounterClockwise,
  Phone,
  IdentificationCard,
  EnvelopeSimple
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function CreateApplicationPage() {
  const router = useRouter();

  // Form fields state
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  
  // Set default dropdown selections matching reference image (Personal Loan, Salaried Employee)
  const [loanType, setLoanType] = useState('PERSONAL');
  const [employmentType, setEmploymentType] = useState('SALARIED');
  
  // Track if user has actively selected dropdown values to toggle summary output
  const [loanTypeChanged, setLoanTypeChanged] = useState(false);
  const [employmentTypeChanged, setEmploymentTypeChanged] = useState(false);

  const [loanAmount, setLoanAmount] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!applicantName.trim()) errors.applicantName = 'Applicant name is required.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid email is required.';
    if (!phone.trim() || !/^\d{10}$/.test(phone)) errors.phone = 'Phone number must be 10 digits.';
    if (!pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) errors.pan = 'PAN must be 10 characters (e.g. ABCDE1234F).';

    if (!loanType) errors.loanType = 'Loan category is required.';
    if (!employmentType) errors.employmentType = 'Employment nature is required.';

    const amt = parseFloat(loanAmount);
    if (isNaN(amt) || amt <= 0) errors.loanAmount = 'Requested amount must be a positive number.';
    const income = parseFloat(monthlyIncome);
    if (isNaN(income) || income < 0) errors.monthlyIncome = 'Net monthly income must be a positive number.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClear = () => {
    setApplicantName('');
    setEmail('');
    setPhone('');
    setPan('');
    setLoanType('PERSONAL');
    setEmploymentType('SALARIED');
    setLoanTypeChanged(false);
    setEmploymentTypeChanged(false);
    setLoanAmount('');
    setMonthlyIncome('');
    setValidationErrors({});
    toast.info('Form cleared.');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please correct the validation errors on the form.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        applicantName,
        email,
        phone,
        pan: pan.toUpperCase(),
        loanType,
        loanAmount: parseFloat(loanAmount),
        monthlyIncome: parseFloat(monthlyIncome),
        employmentType,
      };

      const res = await api.post('/applications', payload);
      if (res.success && res.data) {
        setIsSuccess(true);
        toast.success('Loan Application initialized successfully in DRAFT mode!');
        setTimeout(() => {
          router.push(`/dashboard/applications/${res.data.id}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      if (err.errors && typeof err.errors === 'object') {
        const fieldErrors: Record<string, string> = {};
        Object.entries(err.errors).forEach(([key, val]: any) => {
          fieldErrors[key] = Array.isArray(val) ? val.join(', ') : String(val);
        });
        setValidationErrors(fieldErrors);
        toast.error('Please correct the validation errors below.');
      } else {
        toast.error(err.message || 'Failed to create loan application.');
      }
    } finally {
      setLoading(false);
    }
  };

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
      case 'SALARIED': return 'Salaried Employee';
      case 'SELF_EMPLOYED': return 'Self-Employed Professional';
      case 'BUSINESS_OWNER': return 'Business Owner';
      default: return 'Not Selected';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Page Header matching exact reference */}
      <div className="flex items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-sm select-none">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-500/15">
          <FilePlus className="h-6 w-6" weight="bold" />
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create New Application</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Initiate a new secure credit origination entry</p>
        </div>
      </div>

      {/* Step Indicators Bar */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden select-none grid grid-cols-1 md:grid-cols-3">
        {/* Step 1 */}
        <div className="relative p-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-border">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Identity</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Customer Information</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
        </div>

        {/* Step 2 */}
        <div className="relative p-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-border">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Loan Details</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Loan Preferences</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-border"></div>
        </div>

        {/* Step 3 */}
        <div className="relative p-5 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Financials</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Financial Profile</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-border"></div>
        </div>
      </div>

      {/* Main 3-Column Side-by-Side Form Card */}
      <div className="bg-card border border-border rounded-xli want excetly same as the given ui image  shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          
          {/* Column 1: Customer Identity */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/15">
                <User className="h-5 w-5" weight="bold" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Customer Identity</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Enter accurate customer details. PAN is encrypted at rest using AES-256-GCM.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="applicantName" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                  Applicant Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="applicantName"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="pl-9 h-11 bg-background border-border text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg focus-visible:ring-primary"
                  />
                </div>
                {validationErrors.applicantName && (
                  <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.applicantName}</p>
                )}
              </div>

              {/* Email & Phone side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="email" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                    Email Address
                  </Label>
                  <div className="relative">
                    <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="pl-9 h-11 bg-background border-border text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg focus-visible:ring-primary"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="phone" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                    Mobile Phone (10 digits)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" weight="bold" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      className="pl-9 h-11 bg-background border-border text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg font-mono focus-visible:ring-primary"
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* PAN */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="pan" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                  Permanent Account Number (PAN)
                </Label>
                <div className="relative">
                  <IdentificationCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" weight="bold" />
                  <Input
                    id="pan"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    className="pl-9 h-11 bg-background border-border text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg font-mono uppercase tracking-widest focus-visible:ring-primary"
                  />
                </div>
                {validationErrors.pan && (
                  <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.pan}</p>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Loan Preferences */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/15">
                <Bank className="h-5 w-5" weight="bold" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Loan Preferences</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Select the correct loan product and employment nature.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Loan Category */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="loanType" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                  Loan Category
                </Label>
                <div className="relative">
                  <select
                    id="loanType"
                    value={loanType}
                    onChange={(e) => {
                      setLoanType(e.target.value);
                      setLoanTypeChanged(true);
                    }}
                    className="w-full h-11 px-3 appearance-none rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
                  >
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="HOME">Home Loan</option>
                    <option value="AUTO">Auto Loan</option>
                    <option value="BUSINESS">Business Loan</option>
                    <option value="EDUCATION">Education Loan</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <CaretDown className="h-3.5 w-3.5" />
                  </div>
                </div>
                {validationErrors.loanType && (
                  <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.loanType}</p>
                )}
              </div>

              {/* Employment Nature */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="employmentType" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                  Employment Nature
                </Label>
                <div className="relative">
                  <select
                    id="employmentType"
                    value={employmentType}
                    onChange={(e) => {
                      setEmploymentType(e.target.value);
                      setEmploymentTypeChanged(true);
                    }}
                    className="w-full h-11 px-3 appearance-none rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
                  >
                    <option value="SALARIED">Salaried Employee</option>
                    <option value="SELF_EMPLOYED">Self-Employed Professional</option>
                    <option value="BUSINESS_OWNER">Business Owner</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <CaretDown className="h-3.5 w-3.5" />
                  </div>
                </div>
                {validationErrors.employmentType && (
                  <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.employmentType}</p>
                )}
              </div>

              {/* Note banner */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 flex gap-3 text-left select-none">
                <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Note</span>
                  <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                    Choose the category and employment type that best matches the applicant's profile for accurate assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Financial Profile */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/15">
                <CurrencyInr className="h-5 w-5" weight="bold" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Financial Profile</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Provide loan amount requested and verified monthly income.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Requested Amount */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="loanAmount" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                  Requested Amount (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/80">₹</span>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="pl-8 h-11 bg-background border-border text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg focus-visible:ring-primary"
                  />
                </div>
                {validationErrors.loanAmount && (
                  <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.loanAmount}</p>
                )}
              </div>

              {/* Monthly Income */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="monthlyIncome" className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                  Net Monthly Income (INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/80">₹</span>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 85000"
                    className="pl-8 h-11 bg-background border-border text-foreground placeholder-muted-foreground shadow-sm text-xs rounded-lg focus-visible:ring-primary"
                  />
                </div>
                {validationErrors.monthlyIncome && (
                  <p className="text-[10px] text-destructive font-semibold mt-1">{validationErrors.monthlyIncome}</p>
                )}
              </div>

              {/* Application Summary Box */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex gap-3 text-left select-none">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-2.5 w-full">
                  <span className="text-xs font-bold text-emerald-600 block">Application Summary</span>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-muted-foreground font-semibold">
                    <div className="truncate">
                      Applicant: <span className="text-slate-900 dark:text-white font-bold">{applicantName || 'Not Provided'}</span>
                    </div>
                    <div className="truncate">
                      PAN: <span className="text-slate-900 dark:text-white font-bold font-mono">{pan.toUpperCase() || 'Not Provided'}</span>
                    </div>
                    <div className="truncate">
                      Type: <span className="text-slate-900 dark:text-white font-bold">{loanTypeChanged ? getLoanTypeLabel(loanType) : 'Not Selected'}</span>
                    </div>
                    <div className="truncate">
                      Employment: <span className="text-slate-900 dark:text-white font-bold">{employmentTypeChanged ? getEmploymentLabel(employmentType) : 'Not Selected'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Card Actions Footer matching exact reference */}
        <div className="border-t border-border p-6 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={loading || isSuccess}
            className="w-full sm:w-auto border-border text-slate-700 dark:text-slate-350 hover:bg-muted cursor-pointer h-10 px-4 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm"
          >
            <Trash className="h-4 w-4" weight="bold" />
            Clear Form
          </Button>

          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={loading || isSuccess}
              className="w-full sm:w-auto border-border text-slate-700 dark:text-slate-350 hover:bg-muted cursor-pointer h-10 px-5 font-bold text-xs rounded-lg shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || isSuccess}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer h-10 px-6 rounded-lg shadow-sm"
            >
              {loading ? (
                <><ArrowsCounterClockwise className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><PaperPlaneTilt className="h-4 w-4" weight="bold" /> Submit Application</>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
