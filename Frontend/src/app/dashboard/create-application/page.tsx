'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, RefreshCw, ChevronRight, ChevronLeft, CheckCircle2, User, Briefcase, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 'personal', title: 'Identity', icon: User },
  { id: 'loan', title: 'Loan Details', icon: Briefcase },
  { id: 'financials', title: 'Financials', icon: DollarSign },
];

export default function CreateApplicationPage() {
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);

  // Form fields state
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [loanType, setLoanType] = useState('PERSONAL');
  const [employmentType, setEmploymentType] = useState('SALARIED');
  const [loanAmount, setLoanAmount] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateStep = (stepIndex: number) => {
    const errors: Record<string, string> = {};
    
    if (stepIndex === 0) {
      if (!applicantName.trim()) errors.applicantName = 'Applicant name is required';
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid email is required';
      if (!phone.trim() || !/^\d{10}$/.test(phone)) errors.phone = 'Phone number must be 10 digits';
      if (!pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) errors.pan = 'PAN must be 10 characters (e.g. ABCDE1234F)';
    }

    if (stepIndex === 1) {
      if (!loanType) errors.loanType = 'Loan type is required';
      if (!employmentType) errors.employmentType = 'Employment type is required';
    }

    if (stepIndex === 2) {
      const amt = parseFloat(loanAmount);
      if (isNaN(amt) || amt <= 0) errors.loanAmount = 'Positive number required';
      const income = parseFloat(monthlyIncome);
      if (isNaN(income) || income < 0) errors.monthlyIncome = 'Positive number required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      setValidationErrors({});
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

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

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Link href="/dashboard/my-applications">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border bg-card hover:bg-muted shadow-sm">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Initiate Application</h2>
          <p className="text-sm text-muted-foreground mt-1">Initialize a new secure credit origination entry.</p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="py-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > index;
            const isActive = currentStep === index;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-primary bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20' 
                      : isCompleted 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border-border shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full pointer-events-none border-l border-b border-primary/10"></div>
        <CardHeader className="bg-muted/10 border-b border-border pb-6">
          <CardTitle className="text-xl">
            {currentStep === 0 && 'Customer Identity'}
            {currentStep === 1 && 'Loan Preferences'}
            {currentStep === 2 && 'Financial Profile'}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && 'Ensure customer identity data is entered accurately. PAN is encrypted at rest using AES-256-GCM.'}
            {currentStep === 1 && 'Select the correct loan product and employment categorization.'}
            {currentStep === 2 && 'Enter the requested loan amount and verified monthly income.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 pb-8 min-h-[300px]">
          {/* STEP 1: IDENTITY */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName" className="text-base">Applicant Full Name</Label>
                <Input
                  id="applicantName"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-card border-border focus-visible:ring-primary h-12"
                />
                {validationErrors.applicantName && <p className="text-sm text-destructive">{validationErrors.applicantName}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    className="bg-card border-border focus-visible:ring-primary h-12"
                  />
                  {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base">Mobile Phone (10 digits)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="bg-card border-border focus-visible:ring-primary h-12 font-mono"
                  />
                  {validationErrors.phone && <p className="text-sm text-destructive">{validationErrors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan" className="text-base">Permanent Account Number (PAN)</Label>
                <Input
                  id="pan"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  className="bg-card border-border focus-visible:ring-primary h-12 font-mono uppercase tracking-widest"
                />
                {validationErrors.pan && <p className="text-sm text-destructive">{validationErrors.pan}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: LOAN DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="loanType" className="text-base">Loan Category</Label>
                  <select
                    id="loanType"
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full h-12 px-3 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                  >
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="HOME">Home Loan</option>
                    <option value="AUTO">Auto Loan</option>
                    <option value="BUSINESS">Business Loan</option>
                    <option value="EDUCATION">Education Loan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType" className="text-base">Employment Nature</Label>
                  <select
                    id="employmentType"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full h-12 px-3 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                  >
                    <option value="SALARIED">Salaried Employee</option>
                    <option value="SELF_EMPLOYED">Self-Employed Professional</option>
                    <option value="BUSINESS_OWNER">Business Owner</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINANCIALS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount" className="text-base">Requested Amount (INR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="loanAmount"
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className="bg-card border-border focus-visible:ring-primary h-12 pl-10 text-lg shadow-sm"
                    />
                  </div>
                  {validationErrors.loanAmount && <p className="text-sm text-destructive">{validationErrors.loanAmount}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome" className="text-base">Net Monthly Income (INR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="e.g. 85000"
                      className="bg-card border-border focus-visible:ring-primary h-12 pl-10 text-lg shadow-sm"
                    />
                  </div>
                  {validationErrors.monthlyIncome && <p className="text-sm text-destructive">{validationErrors.monthlyIncome}</p>}
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg border border-border mt-4">
                <h4 className="font-semibold text-sm mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Applicant:</span> {applicantName || '-'}</div>
                  <div><span className="text-muted-foreground">PAN:</span> <span className="font-mono">{pan.toUpperCase() || '-'}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> {loanType || '-'}</div>
                  <div><span className="text-muted-foreground">Employment:</span> {employmentType || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-border p-6 bg-muted/5 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? () => router.push('/dashboard/my-applications') : prevStep}
            disabled={loading || isSuccess}
            className="border-border text-foreground hover:bg-muted cursor-pointer h-11 px-6 shadow-sm"
          >
            {currentStep === 0 ? 'Cancel' : <><ChevronLeft className="mr-2 h-4 w-4" /> Previous</>}
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer h-11 px-8 shadow-sm"
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || isSuccess}
              className="bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 cursor-pointer h-11 px-8 shadow-sm"
            >
              {loading ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Application</>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
